// OP-35 Recibir SMS, pasos 2 a 11 (01 §5.6; 04 §3.6 y §8.4 c), sobre la interpretación ya hecha
// por `@finn/sms` fuera del bloqueo (BE-45). Escribe solo tablas [H] (`movimientos` y
// `movimiento_lineas`): nada entra a `calcular` (inv. 13). La fila de `sms_procesamientos` la arma
// la aplicación con la interpretación y el movimiento que vuelve aquí.
import { esAutodescarte } from '../criterios/autodescarte';
import { sugerirCategoria } from '../criterios/categoria';
import { duplicado } from '../criterios/duplicados';
import { emparejar } from '../criterios/emparejamiento';
import type * as H from '../hechos';
import type { Efecto } from './aplicar';

/** Paso 6: el tipo de transacción que se propone para cada tipo de movimiento bancario. */
const TIPO: Readonly<Record<H.TipoMovimientoBancario, H.TipoTransaccion>> = {
  compra: 'gasto',
  deposito: 'ingreso',
  pago_tarjeta: 'pago_tarjeta',
  devolucion: 'devolucion', // la vinculación queda pendiente de que la indique el usuario
};

/** AV-23 (01 §5.0.7): notificación después del `COMMIT`; un autodescartado no notifica. */
const AV23 = { codigo: 'AV-23', momento: 'despues', requiereConfirmacion: false } as const;
const MOTIVO: Partial<Record<H.EstadoMovimiento, string>> = {
  pendiente: 'nuevo',
  no_reconocido: 'no_reconocido',
  posible_duplicado: 'posible_duplicado',
  con_coincidencia: 'coincidencia',
};

type Nulos = { readonly [K in Exclude<keyof H.Movimiento, 'id' | 'smsId' | 'estado'>]: null };
const VACIO = Object.fromEntries(
  ['cuentaId', 'fecha', 'monto', 'comercio', 'tipoPropuesto', 'nota', 'transaccionId']
    .concat(['duplicadoTransaccionId', 'duplicadoMovimientoId'])
    .concat(['esperadaProgramadaId', 'esperadaFecha'])
    .map((k) => [k, null]),
) as Nulos;

export function op35(antes: H.Instantanea, x: H.ComandoOp35): Efecto {
  const { hechos: h } = antes;
  const [i, base] = [x.interpretacion, { id: x.id, smsId: x.sms.id }];
  const autodescartado = esAutodescarte(x.sms, x.anteriores);
  /** El movimiento y, si tiene monto, su línea (paso 10); AV-23 (paso 11) si no se autodescartó. */
  const efecto = (m: H.Movimiento, categoriaId: H.Uuid | null = null): Efecto => {
    const { cuentaId, fecha, monto, comercio } = m;
    const presentes = Object.entries({ cuentaId, fecha, monto, comercio }).filter((e) => e[1]);
    const datos = {
      movimientoId: m.id,
      motivo: MOTIVO[m.estado] ?? '',
      ...Object.fromEntries(presentes),
    };
    const fila = {
      movimientoId: x.id,
      orden: 1,
      categoriaId,
      deudorId: null,
      lineaOriginalId: null,
    };
    const linea = monto && { ...fila, id: x.ids.siguiente(), monto };
    const cambios: H.Cambio[] = [{ tipo: 'insertar', tabla: 'movimientos', fila: m }];
    if (linea) cambios.push({ tipo: 'insertar', tabla: 'movimiento_lineas', fila: linea });
    return { cambios, avisos: autodescartado ? [] : [{ ...AV23, datos }] };
  };

  // Paso 2 (inv. 16) y paso 3: autodescartado o No reconocido, sin campos, y termina.
  if (i.resultado === 'no_reconocido')
    return efecto({
      ...base,
      ...VACIO,
      estado: autodescartado ? 'autodescartado' : 'no_reconocido',
    });

  // Paso 4 (CB-15): la cuenta por (institución del formato, últimos cuatro); si no existe o está
  // archivada, el movimiento queda sin cuenta y no se puede aprobar hasta asignarle una.
  const cuenta = h.cuentas.find(
    (k) => !k.archivada && k.institucionId === i.institucionId && k.ultimos4 === i.ultimos4,
  );
  const campos = {
    ...base,
    ...VACIO,
    cuentaId: cuenta?.id ?? null,
    fecha: i.fecha ?? x.sms.fechaRecepcion, // paso 5
    monto: i.monto,
    comercio: i.comercio,
    tipoPropuesto: TIPO[i.tipoMovimiento], // paso 6
  };
  // Un autodescartado reconocido conserva los campos de los pasos 4 a 6 para que restaurarlo
  // (OP-39) solo reevalúe los pasos 7 y 8; su línea queda sin destino.
  if (autodescartado) return efecto({ ...campos, estado: 'autodescartado' });

  // Pasos 7 a 9: emparejamiento (con la fecha del SMS), si no duplicados, si no pendiente.
  const comparable = cuenta && { cuentaId: cuenta.id, monto: i.monto, fecha: campos.fecha };
  const esperada = comparable && emparejar(h, x.movimientos, comparable);
  const dup =
    comparable && !esperada
      ? duplicado(h, x.movimientos, { ...comparable, texto: x.sms.texto })
      : undefined;
  const m: H.Movimiento = {
    ...campos,
    estado: esperada ? 'con_coincidencia' : dup ? 'posible_duplicado' : 'pendiente',
    esperadaProgramadaId: esperada?.programadaId ?? null,
    esperadaFecha: esperada?.fecha ?? null,
    duplicadoTransaccionId: dup?.transaccionId ?? null,
    duplicadoMovimientoId: dup?.movimientoId ?? null,
  };
  // Paso 10: la categoría por regla de comercio, si no por historial, si no ninguna.
  return efecto(m, sugerirCategoria(h, x.reglas, i.comercio));
}

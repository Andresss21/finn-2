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
const MOTIVO = {
  pendiente: 'nuevo',
  no_reconocido: 'no_reconocido',
  posible_duplicado: 'posible_duplicado',
  con_coincidencia: 'coincidencia',
} as const;

const VACIO = {
  cuentaId: null,
  fecha: null,
  monto: null,
  comercio: null,
  tipoPropuesto: null,
  nota: null,
  duplicadoTransaccionId: null,
  duplicadoMovimientoId: null,
  esperadaProgramadaId: null,
  esperadaFecha: null,
  transaccionId: null,
} as const;

export function op35(antes: H.Instantanea, x: H.ComandoOp35): Efecto {
  const { hechos: h } = antes;
  const i = x.interpretacion;
  const base = { id: x.id, smsId: x.sms.id };
  const solo = (m: H.Movimiento, avisos: readonly H.AvisoOperacion[] = []): Efecto => ({
    cambios: [{ tipo: 'insertar', tabla: 'movimientos', fila: m }],
    avisos,
  });
  const aviso = (m: H.Movimiento, estado: keyof typeof MOTIVO): H.AvisoOperacion => {
    const { cuentaId, fecha, monto, comercio } = m;
    const presentes = Object.entries({ cuentaId, fecha, monto, comercio }).filter(
      ([, v]) => v !== null,
    );
    const datos = { movimientoId: m.id, motivo: MOTIVO[estado], ...Object.fromEntries(presentes) };
    return { ...AV23, datos };
  };

  // Paso 3 (si no coincide ningún formato): No reconocido, sin campos.
  if (i.resultado === 'no_reconocido') {
    const autodescartado = esAutodescarte(x.sms, x.anteriores);
    const m: H.Movimiento = {
      ...base,
      ...VACIO,
      estado: autodescartado ? 'autodescartado' : 'no_reconocido',
    };
    return solo(m, autodescartado ? [] : [aviso(m, 'no_reconocido')]);
  }

  // Paso 4 (CB-15): la cuenta por (institución del formato, últimos cuatro); si no existe o está
  // archivada, el movimiento queda sin cuenta y no se puede aprobar hasta asignarle una.
  const cuenta = h.cuentas.find(
    (k) => !k.archivada && k.institucionId === i.institucionId && k.ultimos4 === i.ultimos4,
  );
  const campos = {
    ...VACIO,
    cuentaId: cuenta?.id ?? null,
    fecha: i.fecha ?? x.sms.fechaRecepcion, // paso 5
    monto: i.monto,
    comercio: i.comercio,
    tipoPropuesto: TIPO[i.tipoMovimiento], // paso 6
  };
  const linea = (categoriaId: H.Uuid | null): H.Cambio => ({
    tipo: 'insertar',
    tabla: 'movimiento_lineas',
    fila: {
      id: x.ids.siguiente(),
      movimientoId: x.id,
      orden: 1,
      monto: i.monto,
      categoriaId,
      deudorId: null,
      lineaOriginalId: null,
    },
  });

  // Paso 2 (inv. 16): autodescartado y termina. Conserva los campos de los pasos 4 a 6 para que
  // restaurarlo (OP-39) solo tenga que reevaluar los pasos 7 y 8; su línea queda sin destino.
  if (esAutodescarte(x.sms, x.anteriores)) {
    const m: H.Movimiento = { ...base, ...campos, estado: 'autodescartado' };
    return { cambios: [...solo(m).cambios, linea(null)], avisos: [] };
  }

  // Pasos 7 a 9: emparejamiento (con la fecha del SMS), si no duplicados, si no pendiente.
  const comparable = cuenta && { cuentaId: cuenta.id, monto: i.monto, fecha: campos.fecha };
  const esperada = comparable && emparejar(h, x.movimientos, comparable);
  const dup =
    comparable && !esperada
      ? duplicado(h, x.movimientos, { ...comparable, texto: x.sms.texto })
      : undefined;
  const estado = esperada ? 'con_coincidencia' : dup ? 'posible_duplicado' : 'pendiente';
  const m: H.Movimiento = {
    ...base,
    ...campos,
    estado,
    esperadaProgramadaId: esperada?.programadaId ?? null,
    esperadaFecha: esperada?.fecha ?? null,
    duplicadoTransaccionId: dup?.transaccionId ?? null,
    duplicadoMovimientoId: dup?.movimientoId ?? null,
  };

  // Paso 10: una línea por el monto con la categoría sugerida; paso 11: AV-23.
  const categoria = sugerirCategoria(h, x.reglas, i.comercio);
  return { cambios: [...solo(m).cambios, linea(categoria)], avisos: [aviso(m, estado)] };
}

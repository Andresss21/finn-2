// OP-43 Registrar una ocurrencia esperada (01 §5.7, §7.8; 04 §3.7, §10.2 paso 1; P17, B-12, PR-3).
// De un toque: la operación de su tipo (OP-20, OP-23, OP-24 u OP-25) con los datos de la programada
// (editables), la fecha esperada y origen `programada`, y la resolución `registrada`. Automático: las
// pendientes con registro automático y fecha ≤ hoy, en orden cronológico y cada una con su `aplicar`;
// no registra las de un período cerrado ([R2] ajuste 2) y un fallo deja la ocurrencia pendiente
// (CB-33). AV-23 notifica cada una. Una ocurrencia resuelta no se vuelve a registrar (inv. 15).
import { esOcurrencia, pendientes } from '../calculo/ocurrencias';
import { ciclo, periodoDe } from '../calculo/periodos';
import type * as H from '../hechos';
import type { FechaLocal } from '../valores/fecha-local';
import { Centavos } from '../valores/centavos';
import { aplicar, type Efecto } from './aplicar';
import { buscar } from './op-07';
import { op20 } from './op-20';
import { op23 } from './op-23';
import { desglosePropuesto, op24 } from './op-24';
import { op25 } from './op-25';
import { esRechazo } from './rechazos';

/** La programada si `fecha` es una ocurrencia suya sin resolver (§4.16, inv. 15). */
export function ocurrenciaPendiente(
  h: H.Hechos,
  programadaId: H.Uuid,
  fechaEsperada: FechaLocal,
): H.Programada | H.Rechazo {
  const p = buscar(h.programadas, programadaId, 'programadas');
  if (esRechazo(p)) return p;
  const datos = { programadaId: p.id, fechaEsperada };
  if (!esOcurrencia(p, fechaEsperada)) return { codigo: 'ocurrencia_no_valida', datos };
  const resuelta = h.ocurrencias_resueltas.some(
    (o) => o.programadaId === p.id && o.fechaEsperada === fechaEsperada,
  );
  return resuelta ? { codigo: 'ocurrencia_ya_resuelta', datos } : p;
}

/** La operación del tipo de la programada con sus datos, salvo los que editó el usuario. */
function registrar(antes: H.Instantanea, p: H.Programada, x: H.ComandoOp43): Efecto | H.Rechazo {
  const lineas = antes.hechos.programada_lineas
    .filter((l) => l.programadaId === p.id)
    .sort((a, b) => a.orden - b.orden);
  const categoriaId = lineas[0]?.categoriaId ?? ('' as H.Uuid);
  const destino = p.cuentaDestinoId ?? ('' as H.Uuid);
  const { id, instante, ids, fechaEsperada: fecha } = x;
  const base = { id, instante, ids, fecha, comercio: p.comercio, origen: 'programada' as const };
  const total = x.monto ?? p.monto;
  switch (p.tipo) {
    case 'gasto': {
      // Con el monto editado, una sola línea lo toma; con varias, el usuario manda las líneas.
      const propias =
        x.lineas ??
        (x.monto !== undefined && lineas.length === 1 ? [{ monto: total, categoriaId }] : lineas);
      const ls = propias.map((l) => ({ monto: l.monto, destino: { categoriaId: l.categoriaId } }));
      return op20(antes, { ...base, operacion: 'OP-20', total, cuentaId: p.cuentaId, lineas: ls });
    }
    case 'pago_tarjeta':
      return op23(antes, {
        ...base,
        operacion: 'OP-23',
        total,
        origenId: p.cuentaId,
        tarjetaId: destino,
      });
    case 'aporte_inversion': {
      const aporte = { operacion: 'OP-25', modalidad: 'aporte', inversionId: destino } as const;
      return op25(antes, { ...base, ...aporte, total, cuentaId: p.cuentaId, categoriaId });
    }
    case 'cuota_prestamo': {
      // Sin desglose del usuario, el del modelo (Anexo A); sin modelo, queda pendiente (QB-1).
      const d = x.desglose ?? desglosePropuesto(antes, destino, fecha)?.desglosePropuesto ?? null;
      if (d === null)
        return { codigo: 'registro_automatico_sin_modelo', datos: { programadaId: p.id } };
      const { capital, interes, seguro } = d;
      const suma = Centavos.sumar(Centavos.sumar(capital, interes), seguro);
      const cuota = { operacion: 'OP-24', modalidad: 'cuota', prestamoId: destino } as const;
      const desglose = { capital, interes, seguro, origenId: p.cuentaId, categoriaId };
      return op24(antes, { ...base, ...cuota, ...desglose, total: x.monto ?? suma });
    }
  }
}

/** OP-43 de un toque; AV-01 lo agrega `aplicar` si la fecha esperada cae en un período cerrado. */
export function op43(antes: H.Instantanea, x: H.ComandoOp43): Efecto | H.Rechazo {
  const p = ocurrenciaPendiente(antes.hechos, x.programadaId, x.fechaEsperada);
  if (esRechazo(p)) return p;
  const efecto = registrar(antes, p, x);
  if (esRechazo(efecto)) return efecto;
  const resolucion = {
    ...{ id: x.ids.siguiente(), programadaId: p.id, fechaEsperada: x.fechaEsperada },
    ...({ estado: 'registrada', transaccionId: x.id, revision: null } as const),
  };
  const fila: H.Cambio = { tipo: 'insertar', tabla: 'ocurrencias_resueltas', fila: resolucion };
  return { ...efecto, cambios: [...efecto.cambios, fila] };
}

/** El resultado de una ocurrencia del registro automático, en orden cronológico. */
export interface ResultadoOp43Automatico {
  readonly programadaId: H.Uuid;
  readonly fechaEsperada: FechaLocal;
  readonly salida: H.ResultadoAplicar;
}

const AV23 = { codigo: 'AV-23', momento: 'despues', requiereConfirmacion: false } as const;

/** Una ocurrencia del registro automático: la aplicación la corre en su propio `escribir()` (RT-03). */
export function registrarAutomatica(
  hechos: H.Hechos,
  o: Pick<H.ComandoOp43, 'programadaId' | 'fechaEsperada' | 'id' | 'instante' | 'ids'>,
  hoy: FechaLocal,
): H.ResultadoAplicar {
  const { programadaId, fechaEsperada } = o;
  // [R2] ajuste 2: nada retroactivo sin confirmación; queda pendiente y se notifica.
  if (fechaEsperada < periodoDe(ciclo(hechos.vigencias_ciclo), hoy).inicio) {
    const datos = { programadaId, fechaEsperada };
    return { ok: false, rechazos: [{ codigo: 'ocurrencia_en_periodo_cerrado', datos }] };
  }
  return aplicar(hechos, { operacion: 'OP-43', ...o }, hoy);
}

/**
 * Registro automático (04 §10.2 paso 1): las pendientes con fecha ≤ hoy de las programadas activas
 * con registro automático, en orden cronológico; cada una sobre los hechos que dejó la anterior.
 */
export function op43Automatico(
  hechos: H.Hechos,
  hoy: FechaLocal,
  ids: H.GeneradorIds,
  instante: H.Instante,
) {
  const automaticas = new Set(
    hechos.programadas.filter((p) => p.registroAutomatico).map((p) => p.id),
  );
  let h = hechos;
  const resultados = pendientes(hechos, hoy, 0)
    .filter((o) => automaticas.has(o.programadaId))
    .map(({ programadaId, fecha: fechaEsperada }): ResultadoOp43Automatico => {
      const alta = { programadaId, fechaEsperada, id: ids.siguiente(), instante, ids };
      const salida = registrarAutomatica(h, alta, hoy);
      if (salida.ok) h = salida.hechosNuevos;
      return { programadaId, fechaEsperada, salida };
    });
  const avisos: H.AvisoOperacion[] = resultados.map(({ programadaId, fechaEsperada, salida }) => {
    const resultado = salida.ok ? 'registrada' : (salida.rechazos[0]?.codigo ?? '');
    return { ...AV23, datos: { programadaId, fechaEsperada, resultado } };
  });
  return { resultados, hechos: h, avisos };
}

/** Las ocurrencias que el registro automático intenta (04 §10.2 paso 1), en orden cronológico; la aplicación corre cada una en su `escribir()`. */
export function ocurrenciasAutomaticas(hechos: H.Hechos, hoy: FechaLocal) {
  const auto = new Set(hechos.programadas.filter((p) => p.registroAutomatico).map((p) => p.id));
  return pendientes(hechos, hoy, 0)
    .filter((o) => auto.has(o.programadaId))
    .map(({ programadaId, fecha: fechaEsperada }) => ({ programadaId, fechaEsperada }));
}

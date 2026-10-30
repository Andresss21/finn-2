// La tarea diaria (04 §10.2): pasos 1, 2, 5, 6 y 7. Los pasos 3 y 4 llegan en la ola 2 (TA-196) y entran a
// `PASOS_DIARIA`. Un paso que falla no detiene a los demás (10.3): deja un evento `paso_fallido` y la tarea sigue.
// "Hoy" es el `finn.hoy()` de la transacción (P4-9); el tiempo de cada paso lo mide `cronometro` (inyectable).
import {
  cargasCompletasRecientes,
  escribirTecnico as escribirTecnicoDb,
  existeNotificacionConClave,
  leer as leerDb,
  registrarEvento,
  smsSinResultado,
  type CargaCompleta,
  type NuevoEvento,
} from '@finn/db';
import type { Instante } from '@finn/dominio';
import { idErrorAleatorio, type DepsMarco } from '../operaciones/marco.ts';
import { registrarNotificacion } from '../push/registro.ts';
import { procesar } from '../sms/procesar.ts';
import { fechaLocalDeInstante } from '../tiempo/index.ts';
import { purgar, type ResultadoDePaso } from './purgas.ts';
import { pasoRegistro } from './registro-automatico.ts';

/** 10.2 paso 2: máximo de SMS sin resultado por ejecución. */
export const LIMITE_SMS = 200;
/** 5.6: ventana de las métricas y proyección del mes (× 30 / 7). */
export const DIAS_DE_METRICAS = 7;

export interface DepsTarea extends DepsMarco {
  /** Milisegundos monótonos para `ms` de cada paso; por omisión `performance.now()`. */
  readonly cronometro?: () => number;
  /** El `ejecucion` de la puesta al día (BE-50); por omisión un UUID aleatorio. */
  readonly nuevaEjecucion?: () => string;
}

export interface PasoTarea {
  readonly n: number;
  readonly ejecutar: (d: DepsTarea) => Promise<ResultadoDePaso>;
}
export type ResultadoPaso = {
  readonly paso: number;
  readonly resultado: 'ok' | 'error';
  readonly cantidad: number;
  readonly ms: number;
  readonly detalle?: Readonly<Record<string, number>>;
};

/** Registro de un evento de la tarea: sin bloqueo (tabla [T]); quien llama decide si un fallo importa. */
export const registrarDeTarea = (d: DepsTarea, evento: NuevoEvento): Promise<void> =>
  d.registrar
    ? d.registrar(evento)
    : (d.escribirTecnico ?? escribirTecnicoDb)(async (tx) => {
        await registrarEvento(tx, evento);
      }, d.opciones?.());

/** 10.2 paso 2 (8.6): los SMS sin resultado, hasta 200, con el mismo `procesar()` del barrido (BE-62). */
export const pasoSms: PasoTarea = {
  n: 2,
  async ejecutar(d) {
    const ids = await (d.leer ?? leerDb)((tx) => smsSinResultado(tx, LIMITE_SMS), d.opciones?.());
    let procesados = 0;
    for (const id of ids) if ((await procesar(id, d)) === undefined) procesados++; // el fallido sigue sin resultado
    return { cantidad: procesados };
  },
};

/** Percentil 95 por rango más cercano. */
export const p95 = (valores: readonly number[]): number =>
  [...valores].sort((a, b) => a - b)[Math.max(0, Math.ceil(valores.length * 0.95) - 1)] ?? 0;

/** 5.6: egreso del mes proyectado (bytes de la ventana × 30 / 7) y p95 de `ms` de cada día con cargas. */
export function metricasDeCargas(cargas: readonly CargaCompleta[]) {
  const porDia = new Map<string, number[]>();
  for (const c of cargas) {
    const dia: string = fechaLocalDeInstante(c.ocurridoEn.toISOString() as Instante);
    porDia.set(dia, [...(porDia.get(dia) ?? []), c.ms]);
  }
  return {
    egresoProyectadoBytes: Math.round(
      (cargas.reduce((s, c) => s + c.bytes, 0) * 30) / DIAS_DE_METRICAS,
    ),
    p95PorDia: new Map([...porDia].map(([dia, ms]) => [dia, p95(ms)] as const)),
  };
}

/** 10.2 paso 6: solo lectura. Los disparadores que usan estas cifras son del paso 4 (TA-196). */
export const pasoMetricas: PasoTarea = {
  n: 6,
  async ejecutar(d) {
    const cargas = await (d.leer ?? leerDb)(
      (tx) => cargasCompletasRecientes(tx, DIAS_DE_METRICAS),
      d.opciones?.(),
    );
    const m = metricasDeCargas(cargas);
    return {
      cantidad: cargas.length,
      detalle: {
        egresoProyectadoBytes: m.egresoProyectadoBytes,
        p95Maximo: Math.max(0, ...m.p95PorDia.values()),
      },
    };
  },
};

export const pasoPurgas: PasoTarea = { n: 5, ejecutar: purgar };

/** Los pasos implementados, en orden (10.2). */
export const PASOS_DIARIA: readonly PasoTarea[] = [pasoRegistro, pasoSms, pasoPurgas, pasoMetricas];

/** Corre los pasos en orden; el que falla deja `paso_fallido` (10.3) y no detiene a los demás. */
export async function correrPasos(
  pasos: readonly PasoTarea[],
  d: DepsTarea,
): Promise<ResultadoPaso[]> {
  const cron = d.cronometro ?? (() => performance.now());
  const salida: ResultadoPaso[] = [];
  for (const p of pasos) {
    const t0 = cron();
    try {
      const r = await p.ejecutar(d);
      salida.push({
        paso: p.n,
        resultado: 'ok',
        cantidad: r.cantidad,
        ms: Math.round(cron() - t0),
        ...(r.detalle ? { detalle: r.detalle } : {}),
      });
    } catch (e) {
      salida.push({ paso: p.n, resultado: 'error', cantidad: 0, ms: Math.round(cron() - t0) });
      await registrarDeTarea(d, {
        nivel: 'error',
        origen: 'tarea_diaria',
        mensaje: 'paso_fallido',
        datos: {
          paso: p.n,
          idError: (d.nuevoIdError ?? idErrorAleatorio)(),
          mensajeSaneado: e instanceof Error ? e.message : '',
        },
      }).catch(() => undefined); // best-effort: el resultado del paso ya dice que falló
    }
  }
  return salida;
}

/** 10.3: si algún paso falló, una notificación `tarea_fallida` por día (el envío del push es del paso 4). */
async function avisarFallo(d: DepsTarea, hoy: string): Promise<void> {
  const clave = `tarea_fallida:${hoy}`;
  try {
    const ya = await (d.leer ?? leerDb)(
      (tx) => existeNotificacionConClave(tx, clave),
      d.opciones?.(),
    );
    if (ya) return;
    await (d.escribirTecnico ?? escribirTecnicoDb)(async (tx) => {
      await registrarNotificacion(tx, 'tarea_fallida', {
        titulo: 'La tarea diaria tuvo un error',
        cuerpo: 'Revisá Diagnóstico.',
        datos: { clave, destino: { pantalla: 'diagnostico' } },
      });
    }, d.opciones?.());
  } catch {
    // queda el evento paso_fallido
  }
}

/** Los pasos como los guarda el evento de fin (paso 7): `{ paso, resultado, cantidad, ms }`. */
export const pasosParaEvento = (pasos: readonly ResultadoPaso[]) =>
  pasos.map(({ paso, resultado, cantidad, ms }) => ({ paso, resultado, cantidad, ms }));

/** La tarea diaria completa: corre siempre, es la autoridad del día (10.1). */
export async function ejecutarDiaria(
  d: DepsTarea,
  pasos: readonly PasoTarea[] = PASOS_DIARIA,
): Promise<{ hoy: string; pasos: ResultadoPaso[] }> {
  const hoy = await (d.leer ?? leerDb)((tx) => Promise.resolve(tx.estado.hoy), d.opciones?.());
  const resultados = await correrPasos(pasos, d);
  if (resultados.some((r) => r.resultado === 'error')) await avisarFallo(d, hoy);
  await registrarDeTarea(d, {
    nivel: 'info',
    origen: 'tarea_diaria',
    mensaje: 'diaria',
    datos: { hoy, pasos: pasosParaEvento(resultados) },
  });
  return { hoy, pasos: resultados };
}

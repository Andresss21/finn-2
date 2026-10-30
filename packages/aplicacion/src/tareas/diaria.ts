// La tarea diaria (04 §10.2): pasos 2 a 7. El paso 1 llega con TA-194 y entra a `PASOS_DIARIA`. Un paso que falla no
// detiene a los demás (10.3): deja un evento `paso_fallido` y la tarea sigue. Los pasos 3 y 4 leen sin bloqueo, y cada
// notificación es una transacción [T] corta con el push después de su COMMIT (04 §11.1).
// "Hoy" es el `finn.hoy()` de la transacción (P4-9); el tiempo de cada paso lo mide `cronometro` (inyectable).
import {
  ahoraDb,
  cargarHechos,
  cargasCompletasRecientes,
  escribirTecnico as escribirTecnicoDb,
  existeNotificacionConClave,
  leer as leerDb,
  leerEstadoRespaldo,
  registrarEvento,
  smsSinResultado,
  ultimaDerivaInformada,
  type CargaCompleta,
  type LectorTx,
  type NuevoEvento,
} from '@finn/db';
import {
  avisosDeEstado,
  calcular,
  type Instantanea,
  type Instante,
  type Uuid,
} from '@finn/dominio';
import { inicio, ultimoCierre } from '@finn/dominio/selectores';
import { FechaLocal } from '@finn/dominio/valores';
import { formatearFecha, formatearMonto } from '../errores/index.ts';
import { idErrorAleatorio, type DepsMarco } from '../operaciones/marco.ts';
import { notificar, type AvisoPush, type DepsEnvio } from '../push/enviar.ts';
import type { MotivoNotificacion } from '../push/motivos.ts';
import { procesar } from '../sms/procesar.ts';
import { fechaLocalDeInstante } from '../tiempo/index.ts';
import { purgar, type ResultadoDePaso } from './purgas.ts';

/** 10.2 paso 2: máximo de SMS sin resultado por ejecución. */
export const LIMITE_SMS = 200;
/** 5.6: ventana de las métricas y proyección del mes (× 30 / 7). */
export const DIAS_DE_METRICAS = 7;

export interface DepsTarea extends DepsMarco, DepsEnvio {
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

/** 5.6: umbrales de los disparadores de la carga incremental. */
const EGRESO_MAXIMO_BYTES = 2_500_000_000;
const P95_MAXIMO_MS = 500;
const HORAS_RESPALDO = 36;
const DIAS_RESTAURACION = 35;
/** BE-51: períodos anteriores sin push que se dejan en `eventos_sistema` por cierre. */
const ANTERIORES_MAXIMO = 12;
const DIAS_DE_AVISO = 3;

/** La instantánea de la revisión que esta lectura vio. La memoria solo guarda los hechos: las instantáneas son de `consultar`. */
const conInstantanea = <T>(
  d: DepsTarea,
  trabajo: (i: Instantanea, tx: LectorTx) => T | Promise<T>,
) =>
  (d.leer ?? leerDb)(async (tx) => {
    const hechos = await d.memoria.hechos(tx.estado.revision, () => cargarHechos(tx));
    return trabajo(calcular(hechos, FechaLocal.desdeTexto(tx.estado.hoy)), tx);
  }, d.opciones?.());

/** `dd/mm`, como los ejemplos de 04 §11.4 y 06 §5. */
const diaMes = (f: string): string => formatearFecha(f).slice(0, 5);

/** 04 §10.2 paso 3, BE-51: solo el último período cerrado; los anteriores sin push quedan en `eventos_sistema`. */
export const pasoCierre: PasoTarea = {
  n: 3,
  async ejecutar(d) {
    const leido = await conInstantanea(d, async (i, tx) => {
      const c = ultimoCierre(i);
      if (c === null || (await existeNotificacionConClave(tx, `cierre:${c.inicio}`))) return null;
      const sinPush: string[] = [];
      for (const inicio of c.anteriores.slice(0, ANTERIORES_MAXIMO)) {
        if (await existeNotificacionConClave(tx, `cierre:${inicio}`)) break;
        sinPush.push(inicio);
      }
      return { c, sinPush };
    });
    if (leido === null) return { cantidad: 0 };
    const { c, sinPush } = leido;
    const baja =
      c.reduccion > 0
        ? ` Listo para asignar bajó ${formatearMonto(c.reduccion)} por sobregiros.`
        : '';
    const metas =
      c.metasVencidas === 0
        ? ''
        : c.metasVencidas === 1
          ? ' Una meta venció.'
          : ` ${c.metasVencidas} metas vencieron.`;
    await notificar(d, 'cierre_periodo', {
      titulo: 'Cerró el período',
      cuerpo: `Cerró el período del ${diaMes(c.inicio)} al ${diaMes(c.fin)}.${baja}${metas}`,
      datos: {
        clave: `cierre:${c.inicio}`,
        destino: { pantalla: 'presupuesto', periodoInicio: c.inicio },
      },
    });
    for (const periodoInicio of sinPush)
      await registrarDeTarea(d, {
        nivel: 'info',
        origen: 'tarea_diaria',
        mensaje: 'cierre_sin_push',
        datos: { periodoInicio },
      });
    return { cantidad: 1 };
  },
};

interface Candidato {
  readonly motivo: MotivoNotificacion;
  readonly clave: string;
  readonly aviso: AvisoPush;
}

/** Registra y envía los que no tengan todavía su clave (10.3). Cada uno, en su propia transacción corta. */
async function notificarNuevos(d: DepsTarea, candidatos: readonly Candidato[]): Promise<number> {
  const nuevos = await (d.leer ?? leerDb)(async (tx) => {
    const salida: Candidato[] = [];
    for (const c of candidatos)
      if (!(await existeNotificacionConClave(tx, c.clave))) salida.push(c);
    return salida;
  }, d.opciones?.());
  for (const { motivo, clave, aviso } of nuevos)
    await notificar(d, motivo, { ...aviso, datos: { ...aviso.datos, clave } });
  return nuevos.length;
}

/** CF-24 (06 §3.16): la ocurrencia pendiente de una cuota sin registro automático, de hoy a 3 días; una por clave. */
function cuotasProximas(i: Instantanea): Candidato[] {
  return inicio(i, false).atencion.proximosPagos.flatMap((o) => {
    if (o.tipo !== 'cuota_prestamo' || o.registroAutomatico) return [];
    if (FechaLocal.diasEntre(i.hoy, o.fechaEsperada) > DIAS_DE_AVISO) return [];
    const { id: programadaId, nombre } = o.programada;
    return [
      {
        motivo: 'cuota_proxima' as const,
        clave: `cuota:${programadaId}:${o.fechaEsperada}`,
        aviso: {
          titulo: 'Cuota próxima',
          cuerpo: `Cuota de ${nombre} por ${formatearMonto(o.monto)} el ${diaMes(o.fechaEsperada)}. Registrala cuando la pagues.`,
          fechaLimite: o.fechaEsperada,
          datos: {
            programadaId,
            fechaEsperada: o.fechaEsperada,
            destino: { pantalla: 'programada', programadaId, fechaEsperada: o.fechaEsperada },
          },
        },
      },
    ];
  });
}

/** CF-07 (06 §3.8): sin el monto (FD-31), una por tarjeta y fecha de pago. */
const pagosDeTarjeta = (i: Instantanea): Candidato[] =>
  inicio(i, false).atencion.pagosTarjetaProximos.map(({ tarjeta, fechaPago }) => ({
    motivo: 'pago_tarjeta_proximo',
    clave: `pago_tarjeta:${tarjeta.id}:${fechaPago}`,
    aviso: {
      titulo: 'Pago de tarjeta',
      cuerpo: `${tarjeta.nombre}: tu fecha de pago es el ${diaMes(fechaPago)}. Revisá cuánto pagar para no generar intereses.`,
      fechaLimite: fechaPago,
      datos: {
        tarjetaId: tarjeta.id,
        fechaPago,
        destino: { pantalla: 'cuenta', cuentaId: tarjeta.id },
      },
    },
  }));

/** AV-17: una vez por meta y fecha objetivo (10.3). */
const metasVencidas = (i: Instantanea): Candidato[] => {
  const nombre = new Map(i.hechos.categorias.map((c) => [c.id, c.nombre]));
  return avisosDeEstado(i)
    .filter((a) => a.aviso === 'AV-17')
    .map((a) => {
      const categoriaId = a.datos['categoriaId'] as string;
      return {
        motivo: 'meta_vencida',
        clave: `av17:${a.clave}:${String(a.datos['fechaObjetivo'])}`,
        aviso: {
          titulo: 'Meta vencida',
          cuerpo: `Venció la meta de ${nombre.get(categoriaId as Uuid) ?? 'una categoría'}. Revisala en Metas.`,
          datos: { destino: { pantalla: 'categoria', categoriaId } },
        },
      };
    });
};

const deSistema = (
  motivo: MotivoNotificacion,
  clave: string,
  titulo: string,
  cuerpo: string,
): Candidato => ({
  motivo,
  clave,
  aviso: { titulo, cuerpo, datos: { destino: { pantalla: 'diagnostico' } } },
});

/** 03 §7.5, §16, 5.6: los avisos de sistema de hoy. Sin un respaldo o una restauración registrados, no hay atraso que medir. */
async function avisosDeSistema(tx: LectorTx): Promise<Candidato[]> {
  const hoy = tx.estado.hoy;
  const ahora = (await ahoraDb(tx)).getTime();
  const estado = await leerEstadoRespaldo(tx);
  const salida: Candidato[] = [];
  const respaldo = estado?.ultimoRespaldoEn?.getTime();
  if (respaldo !== undefined && ahora - respaldo > HORAS_RESPALDO * 3_600_000)
    salida.push(
      deSistema(
        'respaldo_atrasado',
        `respaldo:${hoy}`,
        'Respaldo atrasado',
        'El último respaldo tiene más de 36 horas. Revisá Diagnóstico.',
      ),
    );
  const restauracion = estado?.ultimaRestauracionEn?.getTime();
  if (restauracion !== undefined && ahora - restauracion > DIAS_RESTAURACION * 86_400_000)
    salida.push(
      deSistema(
        'restauracion_atrasada',
        `restauracion:${hoy}`,
        'Restauración atrasada',
        'La última prueba de restauración tiene más de 35 días. Revisá Diagnóstico.',
      ),
    );
  const deriva = await ultimaDerivaInformada(tx);
  if (deriva !== null)
    salida.push(
      deSistema(
        'deriva_catalogo',
        `deriva:${fechaLocalDeInstante(deriva.toISOString() as Instante)}`,
        'Deriva de catálogo',
        'El respaldo encontró una diferencia en el catálogo. Revisá Diagnóstico.',
      ),
    );
  const m = metricasDeCargas(await cargasCompletasRecientes(tx, DIAS_DE_METRICAS));
  const latencia =
    m.p95PorDia.size >= DIAS_DE_METRICAS &&
    [...m.p95PorDia.values()].every((ms) => ms > P95_MAXIMO_MS);
  if (m.egresoProyectadoBytes > EGRESO_MAXIMO_BYTES || latencia)
    salida.push(
      deSistema(
        'carga_incremental',
        `carga_incremental:${hoy}`,
        'Carga incremental',
        'Conviene activar la carga incremental. Revisá Diagnóstico.',
      ),
    );
  return salida;
}

/** CF-24: también la corre la puesta al día (06 §3.16); las dos comprueban la misma clave. */
export const pasoCuotaProxima: PasoTarea = {
  n: 4,
  ejecutar: async (d) => ({
    cantidad: await notificarNuevos(d, await conInstantanea(d, cuotasProximas)),
  }),
};

/** 04 §10.2 paso 4. */
export const pasoAvisos: PasoTarea = {
  n: 4,
  async ejecutar(d) {
    const candidatos = await conInstantanea(d, async (i, tx) => [
      ...pagosDeTarjeta(i),
      ...cuotasProximas(i),
      ...metasVencidas(i),
      ...(await avisosDeSistema(tx)),
    ]);
    const cantidad = await notificarNuevos(d, candidatos);
    if (candidatos.some((c) => c.motivo === 'carga_incremental') && cantidad > 0) {
      await registrarAvisoDeCarga(d);
    }
    return { cantidad };
  },
};

/** 5.6: el disparador también queda como `aviso`, una vez por día. */
async function registrarAvisoDeCarga(d: DepsTarea): Promise<void> {
  await registrarDeTarea(d, {
    nivel: 'aviso',
    origen: 'tarea_diaria',
    mensaje: 'carga_incremental',
  });
}

/** Los pasos implementados, en orden (10.2). */
export const PASOS_DIARIA: readonly PasoTarea[] = [
  pasoSms,
  pasoCierre,
  pasoAvisos,
  pasoPurgas,
  pasoMetricas,
];

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

/** 10.3: si algún paso falló, una notificación `tarea_fallida` por día, con su push. */
async function avisarFallo(d: DepsTarea, hoy: string): Promise<void> {
  const clave = `tarea_fallida:${hoy}`;
  try {
    const ya = await (d.leer ?? leerDb)(
      (tx) => existeNotificacionConClave(tx, clave),
      d.opciones?.(),
    );
    if (ya) return;
    await notificar(d, 'tarea_fallida', {
      titulo: 'La tarea diaria tuvo un error',
      cuerpo: 'Revisá Diagnóstico.',
      datos: { clave, destino: { pantalla: 'diagnostico' } },
    });
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

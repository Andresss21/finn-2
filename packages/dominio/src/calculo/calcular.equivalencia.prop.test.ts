// Equivalencia de `calcular` antes y después de los índices de TA-109 (corrección) [BE-23]: la
// implementación anterior (main en 408a14a) va copiada aquí, solo en prueba, y las dos dan la
// misma instantánea sobre `hechosArb` y sobre el volumen base a 2 años de 07 §12.7. La copia lleva
// las piezas que cambiaron: consumos y clasificación de devoluciones, presupuesto, LPA al cierre,
// saldos y la composición de la instantánea; las demás se importan, sin cambios.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { correr, type Ejecutor } from '../../escenarios/ejecutar';
import { type Estado, ejecutorMotor } from '../../escenarios/motor';
import { ESCENARIOS } from '../../escenarios/todos';
import type {
  Asignacion,
  Categoria,
  Cuenta,
  Hechos,
  Instantanea,
  Linea,
  Meta,
  TablaMotor,
  Transaccion,
  Uuid,
} from '../hechos';
import { hechosArb } from '../pruebas/generadores';
import { type Paso, Sistema, operacionesArb } from '../pruebas/operaciones';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { actividadDePago, actividadNormal } from './actividad';
import { calcular } from './calcular';
import { clasificacion } from './clasificacion';
import { asignado, noCubiertaDe, type RepartoD2, repartoD2, trasladoA } from './d2';
import { destinos } from './destino';
import {
  type Aporte,
  type CasoDevolucion,
  type Consumo,
  cronologico,
  type Devolucion,
  type HechosDeConsumo,
  type Medio,
  type Momento,
  type NoCubierta,
} from './devoluciones';
import type { Celda, HechosDePresupuesto, PagoImplicito, Presupuesto } from './disponible';
import { listoParaAsignar, lpaAlCierre } from './lpa';
import { evaluarMeta } from './metas';
import { mutante } from './mutantes';
import { pendientes } from './ocurrencias';
import { patrimonioNeto } from './patrimonio';
import { type Ciclo, ciclo, estadoDe, periodoDe, periodosEntre } from './periodos';
import { pagosImplicitos, porCobrar } from './por-cobrar';
import { saldo, saldoConfirmado } from './saldos';
import { reduccionProyectada, sobregiroConTarjetaDelActivo } from './sobregiros';
import { estadoDeTarjeta } from './tarjetas';

const entorno = (globalThis as { process?: { env: Record<string, string | undefined> } }).process
  ?.env;
const opciones = {
  numRuns: Number(entorno?.['FC_RUNS'] ?? '300'),
  seed: Number(entorno?.['FC_SEED'] ?? '0'),
};

// ───────────── La implementación anterior (copia de main en 408a14a) ─────────────

const TIPOS_DE_CONSUMO = new Set(['gasto', 'cuota_prestamo', 'abono_capital', 'aporte_inversion']);
const en = (p: { inicio: string; fin: string }, fecha: string) =>
  p.inicio <= fecha && fecha <= p.fin;
const suma = (xs: readonly Centavos[]) => xs.reduce(Centavos.sumar, Centavos.cero);
const negativo = (x: Centavos) => Centavos.max(Centavos.cero, Centavos.negar(x));

function indice(h: HechosDeConsumo) {
  const cuentas = new Map(h.cuentas.map((k) => [k.id, k]));
  const transacciones = new Map(h.transacciones.map((t) => [t.id, t]));
  const lineas = new Map(h.lineas.map((l) => [l.id, l]));
  const medios = new Map<Uuid, Medio>();
  for (const e of h.efectos) {
    const k = cuentas.get(e.cuentaId);
    if (k === undefined) throw new RangeError(`efecto ${e.id} con cuenta desconocida`);
    if (k.tipo === 'efectivo' || k.tipo === 'tarjeta')
      medios.set(e.transaccionId, {
        cuentaId: k.id,
        tarjetaId: k.tipo === 'tarjeta' ? k.id : null,
      });
  }
  const tx = (id: Uuid): Transaccion => {
    const t = transacciones.get(id);
    if (t === undefined) throw new RangeError(`transacción ${id} desconocida`);
    return t;
  };
  const medio = (id: Uuid): Medio => {
    const m = medios.get(id);
    if (m === undefined) throw new RangeError(`transacción ${id} sin cuenta de efectivo o tarjeta`);
    return m;
  };
  const momento = (l: Linea): Momento => {
    const t = tx(l.transaccionId);
    return { fecha: t.fecha, claveOrden: t.claveOrden, secuencia: t.secuencia, orden: l.orden };
  };
  return { tx, medio, momento, linea: (id: Uuid) => lineas.get(id) };
}

function clasificarAntes(h: HechosDeConsumo, c: Ciclo): Devolucion[] {
  const ix = indice(h);
  const destino = destinos(h.lineas);
  const devoluciones = h.lineas.flatMap((e) => {
    const { categoriaId } = destino(e);
    if (categoriaId === null || ix.tx(e.transaccionId).tipo !== 'devolucion') return [];
    const m = ix.momento(e);
    const k = ix.medio(e.transaccionId);
    const q = periodoDe(c, m.fecha).inicio;
    const original = e.lineaOriginalId === null ? undefined : ix.linea(e.lineaOriginalId);
    const L = original?.categoriaId === null ? undefined : original;
    const deL = L === undefined ? undefined : ix.medio(L.transaccionId);
    const misma = deL !== undefined && deL.cuentaId === k.cuentaId;
    const caso: CasoDevolucion =
      misma && L !== undefined && periodoDe(c, ix.momento(L).fecha).inicio === q
        ? 'D-1'
        : k.tarjetaId === null
          ? 'D-2'
          : misma
            ? 'D-3'
            : 'D-4';
    const d: Devolucion = {
      ...m,
      ...k,
      lineaId: e.id,
      categoriaId,
      monto: e.monto,
      periodo: q,
      lineaOriginalId: L?.id ?? null,
      caso,
    };
    return [d];
  });
  return cronologico(devoluciones);
}

function consumosAntes(h: HechosDeConsumo, c: Ciclo): Consumo[] {
  const ix = indice(h);
  const neteado = new Map<Uuid, Centavos>();
  for (const d of clasificarAntes(h, c))
    if (d.caso === 'D-1' && d.lineaOriginalId !== null)
      neteado.set(
        d.lineaOriginalId,
        Centavos.sumar(neteado.get(d.lineaOriginalId) ?? Centavos.cero, d.monto),
      );
  const deLineas = h.lineas.flatMap((l): Consumo[] => {
    if (l.categoriaId === null || !TIPOS_DE_CONSUMO.has(ix.tx(l.transaccionId).tipo)) return [];
    const neto = Centavos.restar(l.monto, neteado.get(l.id) ?? Centavos.cero);
    return [
      {
        ...ix.momento(l),
        ...ix.medio(l.transaccionId),
        id: l.id,
        fuente: 'linea',
        categoriaId: l.categoriaId,
        monto: l.monto,
        neto,
      },
    ];
  });
  const deCondonaciones = h.condonaciones.map((x): Consumo => {
    const porCobrarL = ix.linea(x.lineaId);
    if (porCobrarL === undefined) throw new RangeError(`condonación ${x.id} sin su línea`);
    return {
      fecha: x.fecha,
      claveOrden: x.claveOrden,
      secuencia: x.secuencia,
      orden: 0,
      ...ix.medio(porCobrarL.transaccionId),
      id: x.id,
      fuente: 'condonacion',
      categoriaId: x.categoriaId,
      monto: x.monto,
      neto: x.monto,
    };
  });
  return cronologico([...deLineas, ...deCondonaciones]);
}

function aportesAntes(h: HechosDeConsumo, c: Ciclo, noCubierta: NoCubierta): Aporte[] {
  const acumulado = new Map<Uuid, Centavos>();
  return clasificarAntes(h, c).flatMap((d): Aporte[] => {
    const cero = Centavos.cero;
    if (d.caso === 'D-1') return [];
    if (d.caso === 'D-2') return [{ ...d, a: cero, aCategoria: d.monto, aPago: cero }];
    let a = cero;
    if (d.caso === 'D-3' && d.lineaOriginalId !== null) {
      const previo = acumulado.get(d.lineaOriginalId) ?? cero;
      a = Centavos.min(d.monto, Centavos.restar(noCubierta(d.lineaOriginalId), previo));
      acumulado.set(d.lineaOriginalId, Centavos.sumar(previo, a));
    }
    const r = Centavos.restar(d.monto, a);
    return [{ ...d, a, aCategoria: r, aPago: Centavos.negar(r) }];
  });
}

function rango(
  h: HechosDePresupuesto,
  c: Ciclo,
  hoy: FechaLocal,
  implicitos: readonly PagoImplicito[],
  proyectados: number,
) {
  const fechas = [
    hoy,
    ...h.transacciones.map((t) => t.fecha),
    ...h.condonaciones.map((x) => x.fecha),
    ...h.asignaciones.map((a: Asignacion) => a.periodoInicio),
    ...implicitos.map((x) => x.fecha),
  ];
  const desde = fechas.reduce((a, b) => (b < a ? b : a));
  let hasta = fechas.reduce((a, b) => (b > a ? b : a));
  for (let k = 0; k < proyectados; k++) hasta = FechaLocal.sumarDias(periodoDe(c, hasta).fin, 1);
  return periodosEntre(c, periodoDe(c, desde).inicio, hasta);
}

function presupuestoAntes(
  h: HechosDePresupuesto,
  c: Ciclo,
  hoy: FechaLocal,
  implicitos: readonly PagoImplicito[],
  proyectados: number,
): Presupuesto {
  const periodos = rango(h, c, hoy, implicitos, proyectados);
  const normales = h.categorias.filter((x) => x.clase === 'normal');
  const dePago = h.categorias.filter((x) => x.clase === 'pago');
  const ks = consumosAntes(h, c);
  const arrastres = new Map<Uuid, Centavos>();
  const celdas: Celda[] = [];
  const repartos: RepartoD2[] = [];
  const todos: Aporte[] = [];
  for (const p of periodos) {
    const estado = estadoDe(p, hoy);
    const deP = aportesAntes(h, c, noCubiertaDe(repartos)).filter((d) => d.periodo === p.inicio);
    todos.push(...deP);
    const arrastreDe = (x: Categoria) => arrastres.get(x.id) ?? Centavos.cero;
    const celdaDe = (x: Categoria, act: Centavos, sobT = Centavos.cero, sobD = Centavos.cero) => {
      const arrastre = arrastreDe(x);
      const asig = asignado(h.asignaciones, x.id, p);
      const disponible = Centavos.sumar(Centavos.sumar(arrastre, asig), act);
      const celda: Celda = {
        categoriaId: x.id,
        clase: x.clase,
        tarjetaId: x.tarjetaId,
        periodo: p,
        estado,
        arrastre,
        asignado: asig,
        actividad: act,
        disponible,
        reinicio: negativo(disponible),
        sobT,
        sobD,
      };
      return celda;
    };
    const delPeriodo: RepartoD2[] = [];
    const siguientes: Celda[] = [];
    for (const x of normales) {
      const r = repartoD2({
        categoriaId: x.id,
        periodo: p,
        consumos: ks,
        aportes: deP,
        arrastre: arrastreDe(x),
        asignado: asignado(h.asignaciones, x.id, p),
      });
      delPeriodo.push(r);
      siguientes.push(celdaDe(x, actividadNormal(ks, deP, x.id, p), r.sobT, r.sobD));
    }
    for (const x of dePago) {
      const t = x.tarjetaId;
      const implicito = suma(
        implicitos.filter((i) => i.tarjetaId === t && en(p, i.fecha)).map((i) => i.monto),
      );
      const traslado = t === null ? Centavos.cero : trasladoA(delPeriodo, t, p);
      const act = Centavos.sumar(
        Centavos.restar(traslado, implicito),
        actividadDePago(h, deP, x, p),
      );
      siguientes.push(celdaDe(x, act));
    }
    for (const y of siguientes)
      arrastres.set(
        y.categoriaId,
        mutante('arrastre') && y.clase === 'normal'
          ? y.disponible
          : Centavos.max(Centavos.cero, y.disponible),
      );
    repartos.push(...delPeriodo);
    celdas.push(...siguientes);
  }
  return {
    periodos,
    activo: periodoDe(c, hoy),
    celdas,
    repartos,
    aportes: todos,
    pagosImplicitos: implicitos,
  };
}

const clave = (x: object): string =>
  'id' in x ? String(x.id) : String((x as { readonly cuentaId: Uuid }).cuentaId);

function canonicos(h: Hechos): Hechos {
  const ordenar = (xs: readonly object[]) =>
    [...xs].sort((a, b) => (clave(a) < clave(b) ? -1 : clave(a) > clave(b) ? 1 : 0));
  const tablas = (Object.keys(h) as TablaMotor[]).sort();
  return Object.fromEntries(tablas.map((t) => [t, ordenar(h[t])])) as unknown as Hechos;
}

function congelar<T>(x: T): T {
  if (typeof x !== 'object' || x === null || Object.isFrozen(x)) return x;
  Object.freeze(x);
  for (const v of Object.values(x)) congelar(v);
  return x;
}

function calcularAntes(hechos: Hechos, hoy: FechaLocal): Instantanea {
  const h = canonicos(hechos);
  const c = ciclo(h.vigencias_ciclo);
  const cuentas = h.cuentas.map((k: Cuenta) => ({
    cuentaId: k.id,
    tipo: k.tipo,
    saldo: saldo(h, k.id),
    confirmado: saldoConfirmado(h, k.id),
  }));
  const cobros = porCobrar(h);
  const b = presupuestoAntes(h, c, hoy, pagosImplicitos(cobros), 1);
  const tarjetas = h.cuentas
    .filter((k) => k.tipo === 'tarjeta')
    .map((k) => estadoDeTarjeta(h, b, k.id));
  const categorias = new Map(h.categorias.map((x) => [x.id, x]));
  const metas = h.metas.map((m) => {
    const x = categorias.get(m.categoriaId);
    if (x === undefined) throw new RangeError(`la meta ${m.id} no tiene categoría (inv. 25)`);
    return { metaId: m.id, categoriaId: m.categoriaId, evaluacion: evaluarMeta(m, x, b, c, hoy) };
  });
  const movimientos = { consumos: consumosAntes(h, c), devoluciones: clasificarAntes(h, c) };
  return congelar({
    hechos: h,
    hoy,
    ciclo: c,
    cuentas,
    porCobrar: cobros,
    presupuesto: b,
    sobregiroConTarjeta: sobregiroConTarjetaDelActivo(b),
    reduccionProyectada: reduccionProyectada(b),
    tarjetas,
    lpa: listoParaAsignar(h, b, cobros),
    historialLpa: b.periodos
      .filter((p) => p.inicio < b.activo.inicio)
      .map((periodo) => ({ periodo, lpa: lpaAlCierre(h, b, periodo) })),
    metas,
    clasificacion: clasificacion(h, c, cobros, movimientos),
    patrimonio: patrimonioNeto(h, cobros),
    ocurrencias: pendientes(h, hoy, 30),
  });
}

// ───────────── Casos ─────────────

/** Un hoy de 2027 y unos hechos válidos hasta ese día, con una meta por categoría normal. */
const casoArb = fc
  .integer({ min: 9, max: 364 })
  .map((n) => FechaLocal.sumarDias(FechaLocal.desdePartes(2027, 1, 1), n))
  .chain((hoy) =>
    hechosArb(hoy).map((h) => {
      const metas: Meta[] = h.categorias
        .filter((x) => x.clase === 'normal')
        .map((x, k) => ({
          id: `${x.id}m` as Meta['id'],
          categoriaId: x.id,
          tipo: 'mensual',
          modo: k % 2 === 0 ? 'acumular' : 'rellenar_hasta',
          monto: Centavos.desdeEntero(1000 * (k + 1)),
          fechaObjetivo: null,
          fechaCreacion: FechaLocal.desdeTexto('2027-01-01'),
          revision: null,
        }));
      return { hoy, h: { ...h, metas } };
    }),
  );

// El generador de volumen llega con TA-156 (#123); hasta entonces, el caso de volumen se omite.
type Generador = {
  generarHechos: (op: { nivel: 'base'; anios: number; semilla: number }) => Hechos;
  fechaFinal: (op: { anios: number }) => FechaLocal;
};
const generador = Object.values(
  import.meta.glob<Generador>('../../../../tools/pruebas/volumen/generar.ts', { eager: true }),
)[0];

/**
 * Cada devolución vinculada, repetida 40 y 80 días después: D-3 de una misma L en varios períodos,
 * para que A_L acumule las partes a de períodos anteriores.
 */
function conDevolucionesRepetidas(h: Hechos): Hechos {
  // Las de un por cobrar no: repetidas superarían su saldo abierto (inv. 9).
  const porCobrarL = new Set(h.lineas.filter((l) => l.deudorId !== null).map((l) => l.id));
  const deCobro = (l: Linea) => l.lineaOriginalId !== null && porCobrarL.has(l.lineaOriginalId);
  const conCobro = new Set(h.lineas.filter(deCobro).map((l) => l.transaccionId));
  const vinculadas = new Set(
    h.lineas
      .filter((l) => l.lineaOriginalId !== null && !conCobro.has(l.transaccionId))
      .map((l) => l.transaccionId),
  );
  const copias = h.transacciones
    .filter((t) => t.tipo === 'devolucion' && vinculadas.has(t.id))
    .flatMap((t) => [40, 80].map((dias) => ({ t, dias, sufijo: `-r${dias}` })));
  const nuevo = (x: Uuid, sufijo: string) => `${x}${sufijo}` as Uuid;
  return {
    ...h,
    transacciones: [
      ...h.transacciones,
      ...copias.map(({ t, dias, sufijo }) => ({
        ...t,
        id: nuevo(t.id, sufijo),
        fecha: FechaLocal.sumarDias(t.fecha, dias),
      })),
    ],
    efectos: [
      ...h.efectos,
      ...copias.flatMap(({ t, sufijo }) =>
        h.efectos
          .filter((e) => e.transaccionId === t.id)
          .map((e) => ({ ...e, id: nuevo(e.id, sufijo), transaccionId: nuevo(t.id, sufijo) })),
      ),
    ],
    lineas: [
      ...h.lineas,
      ...copias.flatMap(({ t, sufijo }) =>
        h.lineas
          .filter((l) => l.transaccionId === t.id)
          .map((l) => ({ ...l, id: nuevo(l.id, sufijo), transaccionId: nuevo(t.id, sufijo) })),
      ),
    ],
  };
}

/**
 * Las dos implementaciones dan lo mismo en `hoy` y más adelante, cuando los períodos de los hechos
 * ya cerraron: así el historial de LPA recorre los cobros y el dinero en camino de cada cierre.
 */
function iguales(h: Hechos, hoy: FechaLocal) {
  for (const dias of [0, 45, 400]) {
    const despues = FechaLocal.sumarDias(hoy, dias);
    expect(calcular(h, despues)).toStrictEqual(calcularAntes(h, despues));
  }
  const repetidas = conDevolucionesRepetidas(h);
  const despues = FechaLocal.sumarDias(hoy, 120);
  if (repetidas.lineas.length > h.lineas.length)
    expect(calcular(repetidas, despues)).toStrictEqual(calcularAntes(repetidas, despues));
}

/** Después de cada paso aceptado de `operacionesArb`. */
const igualesTrasElPaso = ({ resultado, antes }: Paso) => {
  if (resultado.ok) iguales(resultado.hechosNuevos, antes.hoy);
};

/** El ejecutor de escenarios del motor, que además compara las dos después de cada paso. */
const comparando: Ejecutor<Estado> = {
  ...ejecutorMotor,
  async paso(s, p) {
    const observado = await ejecutorMotor.paso(s, p);
    iguales(s.hechos, s.hoy);
    return observado;
  },
};

describe('PRU-PROP-MOTOR', () => {
  it('PRU-PROP-MOTOR-108 [INV-26] calcular con índices por celda (BE-23) da la misma instantánea que la implementación anterior, sobre hechosArb, operacionesArb, los escenarios y el volumen base a 2 años (04 §2.4, §5.6)', async () => {
    fc.assert(
      fc.property(casoArb, ({ hoy, h }) => {
        iguales(h, hoy);
      }),
      opciones,
    );
    // Con condonaciones y devoluciones vinculadas (D-1 a D-4) que hechosArb no genera.
    fc.assert(
      fc.property(
        casoArb.chain(({ hoy, h }) => fc.tuple(fc.constant(hoy), fc.constant(h), operacionesArb())),
        ([hoy, h, comandos]) => {
          const sistema = new Sistema(h, hoy, igualesTrasElPaso);
          fc.modelRun(() => ({ model: {}, real: sistema }), comandos);
        },
      ),
      opciones,
    );
    // Con cobros, pagos implícitos y varios períodos cerrados: cada paso de cada escenario.
    for (const id of ESCENARIOS.keys()) await correr(id, ESCENARIOS, comparando);
    if (generador !== undefined) {
      const op = { nivel: 'base', anios: 2, semilla: opciones.seed } as const;
      const h = generador.generarHechos(op);
      iguales(h, generador.fechaFinal(op));
    }
  }, 120_000);
});

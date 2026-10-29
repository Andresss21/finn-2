// Equivalencia de `calcular` antes y después de los índices de TA-109 (correcciones #124 y #128)
// [BE-23]: la implementación anterior (main en 408a14a, el padre de #124) va copiada aquí, solo en
// prueba, y las dos dan la misma instantánea sobre `hechosArb`, `operacionesArb`, los escenarios y
// el volumen de 07 §12.7. La copia es autónoma (TA-109 corrección 3): de producción importa solo
// `calcular`, tipos y los valores `Centavos` y `FechaLocal`; ninguna otra función de cálculo. Va
// todo lo que `calcular` alcanzaba, sin los comentarios ni las funciones que no usa, y sin los
// mutantes de 07 §19.4: con FINN_MUTANTE, la copia sigue siendo la regla correcta.
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
  Programada,
  TablaMotor,
  TipoTransaccion,
  Transaccion,
  Uuid,
} from '../hechos';
import { hechosArb } from '../pruebas/generadores';
import { type Paso, Sistema, operacionesArb } from '../pruebas/operaciones';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { calcular } from './calcular';
import type { ClaseDeReporte, Clasificacion, Partida } from './clasificacion';
import type { EntradaD2, Parte, RepartoD2 } from './d2';
import type {
  Aporte,
  CasoDevolucion,
  Consumo,
  Devolucion,
  HechosDeConsumo,
  Medio,
  Momento,
  NoCubierta,
} from './devoluciones';
import type { Celda, HechosDePresupuesto, PagoImplicito, Presupuesto } from './disponible';
import type { DetalleLpa, EntradasPorClase, HechosDeLpa } from './lpa';
import type { EstadoDeMeta, EvaluacionDeMeta } from './metas';
import type { OcurrenciaPendiente, ReglaDeOcurrencia } from './ocurrencias';
import type { PatrimonioNeto } from './patrimonio';
import type { Ciclo, EstadoDePeriodo, Periodo, Tramo, VigenciaDeCiclo } from './periodos';
import type { EntradaDeCobro, EventoDePorCobrar, HechosDePorCobrar, PorCobrar } from './por-cobrar';
import type { FiltroDeSaldo, HechosDeSaldo } from './saldos';
import type { EstadoDeTarjeta } from './tarjetas';

const entorno = (globalThis as { process?: { env: Record<string, string | undefined> } }).process
  ?.env;
const opciones = {
  numRuns: Number(entorno?.['FC_RUNS'] ?? '300'),
  seed: Number(entorno?.['FC_SEED'] ?? '0'),
};
// El volumen alto a 10 años suma de 12 a 25 s con la copia, que es cuadrática: solo corre con los
// FC_RUNS del nocturno (nocturno.yml, job `prop`), no en `rapido`.
const NOCTURNO = opciones.numRuns >= 10_000;

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
      arrastres.set(y.categoriaId, Centavos.max(Centavos.cero, y.disponible));
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
    clasificacion: clasificacion(h, c, cobros),
    patrimonio: patrimonioNeto(h, cobros),
    ocurrencias: pendientes(h, hoy, 30),
  });
}

// ───────────── El resto de la copia: lo que antes se importaba de producción ─────────────

const positivo = (x: Centavos) => Centavos.max(Centavos.cero, x);

// periodos.ts
const { comparar, inicioDeMes, sumarDias, sumarMeses } = FechaLocal;
const menor = (a: FechaLocal, b: FechaLocal) => (a < b ? a : b);
const mayor = (a: FechaLocal, b: FechaLocal) => (a > b ? a : b);

function ciclo(vigencias: readonly VigenciaDeCiclo[]): Ciclo {
  const primeras = vigencias.filter((v) => v.rigeDesde === null);
  const [primera] = primeras;
  if (primera === undefined || primeras.length !== 1)
    throw new RangeError(`se esperaba una sola vigencia sin "rige desde"; hay ${primeras.length}`);
  for (const v of vigencias)
    if (!Number.isInteger(v.diaInicio) || v.diaInicio < 1 || v.diaInicio > 31)
      throw new RangeError(`día de inicio fuera de 1–31: ${v.diaInicio}`);
  const resto = vigencias
    .flatMap((v) => (v.rigeDesde === null ? [] : [{ ...v, rigeDesde: v.rigeDesde }]))
    .sort((a, b) => comparar(a.rigeDesde, b.rigeDesde));
  resto.forEach((v, i) => {
    if (i > 0 && v.rigeDesde === resto[i - 1]?.rigeDesde)
      throw new RangeError(`dos vigencias rigen desde ${v.rigeDesde}`);
  });
  const desdes = [null, ...resto.map((v) => v.rigeDesde)];
  const tramo = (v: VigenciaDeCiclo, i: number): Tramo => ({
    diaInicio: v.diaInicio,
    rigeDesde: desdes[i] ?? null,
    rigeHasta: desdes[i + 1] ?? null,
  });
  return [tramo(primera, 0), ...resto.map((v, i) => tramo(v, i + 1))] as unknown as Ciclo;
}

const vigenciaDe = (c: Ciclo, f: FechaLocal): Tramo =>
  c.reduce((elegida, t) => (t.rigeDesde !== null && t.rigeDesde <= f ? t : elegida), c[0]);

function periodoDe(c: Ciclo, f: FechaLocal): Periodo {
  const { diaInicio, rigeDesde: r, rigeHasta: tope } = vigenciaDe(c, f);
  const deEsteMes = inicioDeMes(f, diaInicio);
  const previo = deEsteMes <= f ? deEsteMes : inicioDeMes(sumarMeses(deEsteMes, -1), diaInicio);
  const proximo = deEsteMes > f ? deEsteMes : inicioDeMes(sumarMeses(deEsteMes, 1), diaInicio);
  const inicio = r === null ? previo : mayor(previo, r);
  const siguiente = tope === null ? proximo : menor(proximo, tope);
  const transicion = inicio === r && inicioDeMes(r, diaInicio) !== r;
  return { inicio, fin: sumarDias(siguiente, -1), transicion };
}

function periodosEntre(c: Ciclo, desde: FechaLocal, hasta: FechaLocal): Periodo[] {
  const periodos: Periodo[] = [];
  for (let f = desde; f <= hasta;) {
    const p = periodoDe(c, f);
    periodos.push(p);
    f = sumarDias(p.fin, 1);
  }
  return periodos;
}

function estadoDe(p: Periodo, hoy: FechaLocal): EstadoDePeriodo {
  if (p.fin < hoy) return 'cerrado';
  return p.inicio > hoy ? 'futuro' : 'activo';
}

const duracion = (p: Periodo): number => FechaLocal.diasEntre(p.inicio, p.fin) + 1;

// saldos.ts
function saldo(h: HechosDeSaldo, cuentaId: Uuid, filtro: FiltroDeSaldo = {}): Centavos {
  const transacciones = new Map(h.transacciones.map((t) => [t.id, t]));
  let total = Centavos.cero;
  for (const e of h.efectos) {
    if (e.cuentaId !== cuentaId) continue;
    const t = transacciones.get(e.transaccionId);
    if (t === undefined) throw new RangeError(`efecto ${e.id} sin su transacción`);
    if (filtro.hasta !== undefined && t.fecha > filtro.hasta) continue;
    if (filtro.confirmado === true && t.estadoBancario === 'pendiente') continue;
    total = Centavos.sumar(total, e.monto);
  }
  return total;
}

const saldoConfirmado = (h: HechosDeSaldo, cuentaId: Uuid): Centavos =>
  saldo(h, cuentaId, { confirmado: true });
const deuda = (h: HechosDeSaldo, tarjetaId: Uuid): Centavos =>
  Centavos.max(Centavos.cero, Centavos.negar(saldo(h, tarjetaId)));
const saldoAFavor = (h: HechosDeSaldo, tarjetaId: Uuid): Centavos =>
  Centavos.max(Centavos.cero, saldo(h, tarjetaId));
const capitalPendiente = (h: HechosDeSaldo, prestamoId: Uuid): Centavos => saldo(h, prestamoId);

// destino.ts
type Destino = Pick<Linea, 'categoriaId' | 'deudorId'>;
type ConDestino = Destino & Pick<Linea, 'lineaOriginalId'>;

function destinoDe(l: ConDestino, lineas: ReadonlyMap<Uuid, ConDestino>): Destino {
  const o = l.lineaOriginalId === null ? undefined : lineas.get(l.lineaOriginalId);
  const d = o ?? l;
  return { categoriaId: d.categoriaId, deudorId: d.deudorId };
}

function destinos(lineas: readonly Linea[]): (l: ConDestino) => Destino {
  const porId = new Map<Uuid, ConDestino>(lineas.map((l) => [l.id, l]));
  return (l) => destinoDe(l, porId);
}

// devoluciones.ts: el orden cronológico
const claveDe = (m: Momento) =>
  `${m.fecha}|${m.claveOrden}|${m.secuencia === null ? '~' : m.secuencia.padStart(20, '0')}|${String(m.orden).padStart(6, '0')}`;

const cronologico = <T extends Momento>(xs: readonly T[]): T[] =>
  xs
    .map((x) => [claveDe(x), x] as const)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([, x]) => x);

// actividad.ts
function actividadNormal(
  ks: readonly Consumo[],
  deP: readonly Aporte[],
  categoriaId: Uuid,
  p: Periodo,
): Centavos {
  const consumido = suma(
    ks.filter((k) => k.categoriaId === categoriaId && en(p, k.fecha)).map((k) => k.neto),
  );
  const aportado = suma(
    deP.filter((d) => d.categoriaId === categoriaId && en(p, d.fecha)).map((d) => d.aCategoria),
  );
  return Centavos.restar(aportado, consumido);
}

function actividadDePago(
  h: Pick<Hechos, 'transacciones' | 'lineas'>,
  deP: readonly Aporte[],
  pago: Pick<Categoria, 'id' | 'tarjetaId'>,
  p: Periodo,
): Centavos {
  const fechas = new Map(
    h.transacciones.filter((t) => t.tipo === 'pago_tarjeta').map((t) => [t.id, t.fecha]),
  );
  const pagado = suma(
    h.lineas
      .filter((l) => {
        const fecha = fechas.get(l.transaccionId);
        return l.categoriaId === pago.id && fecha !== undefined && en(p, fecha);
      })
      .map((l) => l.monto),
  );
  const devuelto = suma(
    deP.filter((d) => d.tarjetaId === pago.tarjetaId && en(p, d.fecha)).map((d) => d.aPago),
  );
  return Centavos.sumar(Centavos.negar(pagado), devuelto);
}

// d2.ts
const entradasD2 = (deP: readonly Aporte[], categoriaId: Uuid, p: Periodo): Centavos =>
  suma(deP.filter((d) => d.categoriaId === categoriaId && en(p, d.fecha)).map((d) => d.aCategoria));

const asignado = (asignaciones: readonly Asignacion[], categoriaId: Uuid, p: Periodo): Centavos =>
  suma(
    asignaciones
      .filter((a) => a.categoriaId === categoriaId && a.periodoInicio === p.inicio)
      .map((a) => a.monto),
  );

function repartoD2(e: EntradaD2): RepartoD2 {
  const ent = entradasD2(e.aportes, e.categoriaId, e.periodo);
  const fondo = Centavos.sumar(Centavos.sumar(e.arrastre, e.asignado), ent);
  const deC = e.consumos.filter((k) => k.categoriaId === e.categoriaId && en(e.periodo, k.fecha));
  const deCp = cronologico(deC);
  let restante = fondo;
  const partes = deCp.map((k): Parte => {
    const cubierto = Centavos.max(Centavos.cero, Centavos.min(k.neto, restante));
    restante = Centavos.restar(restante, cubierto);
    return { consumo: k, cubierto, noCubierto: Centavos.restar(k.neto, cubierto) };
  });
  const traslados = new Map<Uuid, Centavos>();
  let sobT = Centavos.cero;
  for (const x of partes) {
    const t = x.consumo.tarjetaId;
    if (t === null) continue;
    sobT = Centavos.sumar(sobT, x.noCubierto);
    const tr = x.cubierto;
    if (tr > 0) traslados.set(t, Centavos.sumar(traslados.get(t) ?? Centavos.cero, tr));
  }
  const disponible = Centavos.restar(fondo, suma(partes.map((x) => x.consumo.neto)));
  const sobregiro = Centavos.max(Centavos.cero, Centavos.negar(disponible));
  return {
    categoriaId: e.categoriaId,
    periodo: e.periodo,
    entradas: ent,
    fondo,
    partes,
    traslados,
    disponible,
    sobT,
    sobD: Centavos.restar(sobregiro, sobT),
  };
}

const trasladoA = (repartos: readonly RepartoD2[], tarjetaId: Uuid, p: Periodo): Centavos =>
  suma(
    repartos
      .filter((r) => r.periodo.inicio === p.inicio)
      .map((r) => r.traslados.get(tarjetaId) ?? Centavos.cero),
  );

function noCubiertaDe(repartos: readonly RepartoD2[]): NoCubierta {
  const u = new Map<Uuid, Centavos>();
  for (const r of repartos) for (const x of r.partes) u.set(x.consumo.id, x.noCubierto);
  return (lineaId) => u.get(lineaId) ?? Centavos.cero;
}

// disponible.ts: lo que una celda reduce de LPA al cerrar
const reduccionDe = (x: Celda): Centavos => (x.clase === 'pago' ? x.reinicio : x.sobD);

// por-cobrar.ts
type Pendiente = Omit<EventoDePorCobrar, 'restituido' | 'excedente' | 'abierto'>;
const momento = (x: Omit<Momento, 'orden'>, orden: number): Momento => ({
  fecha: x.fecha,
  claveOrden: x.claveOrden,
  secuencia: x.secuencia,
  orden,
});

function medios(h: HechosDePorCobrar) {
  const cuentas = new Map(h.cuentas.map((k) => [k.id, k]));
  const m = new Map<Uuid, Medio>();
  for (const e of h.efectos) {
    const k = cuentas.get(e.cuentaId);
    if (k?.tipo === 'efectivo' || k?.tipo === 'tarjeta')
      m.set(e.transaccionId, { cuentaId: k.id, tarjetaId: k.tipo === 'tarjeta' ? k.id : null });
  }
  return (transaccionId: Uuid): Medio => {
    const x = m.get(transaccionId);
    if (x === undefined)
      throw new RangeError(`transacción ${transaccionId} sin cuenta de efectivo o tarjeta`);
    return x;
  };
}

function porCobrar(h: HechosDePorCobrar, hasta?: FechaLocal): PorCobrar[] {
  const medio = medios(h);
  const txs = new Map(h.transacciones.map((t) => [t.id, t]));
  const vale = (fecha: FechaLocal) => hasta === undefined || fecha <= hasta;
  const pendientes = new Map<Uuid, Pendiente[]>();
  const agregar = (lineaId: Uuid, e: Pendiente) => {
    if (vale(e.fecha)) pendientes.set(lineaId, [...(pendientes.get(lineaId) ?? []), e]);
  };
  for (const t of h.transacciones)
    if (t.tipo === 'cobro' && t.lineaCobradaId !== null)
      agregar(t.lineaCobradaId, {
        ...momento(t, 0),
        id: t.id,
        tipo: 'cobro',
        monto: t.total,
        cuenta: medio(t.id),
      });
  for (const x of h.condonaciones)
    agregar(x.lineaId, {
      ...momento(x, 0),
      id: x.id,
      tipo: 'condonacion',
      monto: x.monto,
      cuenta: null,
    });
  for (const l of h.lineas) {
    const t = txs.get(l.transaccionId);
    if (t?.tipo === 'devolucion' && l.lineaOriginalId !== null)
      agregar(l.lineaOriginalId, {
        ...momento(t, l.orden),
        id: l.id,
        tipo: 'devolucion',
        monto: l.monto,
        cuenta: medio(t.id),
      });
  }
  return h.lineas.flatMap((l): PorCobrar[] => {
    const t = txs.get(l.transaccionId);
    if (l.deudorId === null || t?.tipo !== 'gasto' || !vale(t.fecha)) return [];
    let abierto = l.monto;
    const eventos = cronologico(pendientes.get(l.id) ?? []).map((e): EventoDePorCobrar => {
      let restituido = Centavos.cero;
      let excedente = Centavos.cero;
      if (e.tipo === 'cobro') {
        restituido = Centavos.min(e.monto, abierto);
        excedente = Centavos.restar(e.monto, restituido);
      } else if (e.monto > abierto)
        throw new RangeError(`${e.tipo} ${e.id} supera el saldo abierto de ${l.id} (inv. 9)`);
      abierto = Centavos.restar(abierto, e.tipo === 'cobro' ? restituido : e.monto);
      return { ...e, restituido, excedente, abierto };
    });
    const de = (tipo: EventoDePorCobrar['tipo']) =>
      suma(eventos.filter((e) => e.tipo === tipo).map((e) => e.monto));
    return [
      {
        lineaId: l.id,
        deudorId: l.deudorId,
        fecha: t.fecha,
        monto: l.monto,
        medio: medio(t.id),
        eventos,
        abierto,
        restituido: suma(eventos.map((e) => e.restituido)),
        condonado: de('condonacion'),
        devuelto: de('devolucion'),
      },
    ];
  });
}

const dineroEnCamino = (xs: readonly PorCobrar[]): Centavos =>
  suma(xs.filter((x) => x.medio.tarjetaId === null).map((x) => x.abierto));

const porCobrarAbierto = (xs: readonly PorCobrar[]): Centavos => suma(xs.map((x) => x.abierto));

const pagosImplicitos = (xs: readonly PorCobrar[]): PagoImplicito[] =>
  xs.flatMap((x) =>
    x.medio.tarjetaId !== null
      ? []
      : x.eventos.flatMap((e) =>
          e.cuenta === null || e.cuenta.tarjetaId === null || e.restituido <= 0
            ? []
            : [{ tarjetaId: e.cuenta.tarjetaId, fecha: e.fecha, monto: e.restituido }],
        ),
  );

const entradasDeCobros = (xs: readonly PorCobrar[]): EntradaDeCobro[] =>
  xs.flatMap((x) =>
    x.eventos.flatMap((e): EntradaDeCobro[] => {
      if (e.tipo !== 'cobro' || e.cuenta === null || e.cuenta.tarjetaId !== null) return [];
      const r: EntradaDeCobro[] = [];
      if (e.excedente > 0) r.push({ fecha: e.fecha, clase: 'ingreso', monto: e.excedente });
      if (x.medio.tarjetaId !== null && e.restituido > 0)
        r.push({ fecha: e.fecha, clase: 'restitucion', monto: e.restituido });
      return r;
    }),
  );

// lpa.ts
const CLASE: Partial<Record<TipoTransaccion, 'ingreso' | 'otras' | 'saldoInicial'>> = {
  ingreso: 'ingreso',
  saldo_inicial: 'saldoInicial',
  desembolso_prestamo: 'otras',
  retiro_inversion: 'otras',
  avance_efectivo: 'otras',
};

function entradas(
  h: HechosDeLpa,
  cobros: readonly PorCobrar[],
  hasta?: FechaLocal,
): EntradasPorClase {
  const efectivo = new Set(h.cuentas.filter((k) => k.tipo === 'efectivo').map((k) => k.id));
  const txs = new Map(h.transacciones.map((t) => [t.id, t]));
  const vale = (fecha: FechaLocal) => hasta === undefined || fecha <= hasta;
  const por = {
    ingreso: Centavos.cero,
    otras: Centavos.cero,
    restitucion: Centavos.cero,
    saldoInicial: Centavos.cero,
  };
  for (const e of h.efectos) {
    const t = txs.get(e.transaccionId);
    const clase = t === undefined ? undefined : CLASE[t.tipo];
    if (t === undefined || clase === undefined || !efectivo.has(e.cuentaId) || !vale(t.fecha))
      continue;
    por[clase] = Centavos.sumar(por[clase], e.monto);
  }
  for (const x of entradasDeCobros(cobros))
    if (vale(x.fecha)) por[x.clase] = Centavos.sumar(por[x.clase], x.monto);
  return { ...por, total: suma(Object.values(por)) };
}

const asignadoSi = (h: HechosDeLpa, cumple: (inicio: FechaLocal) => boolean): Centavos =>
  suma(h.asignaciones.filter((a) => cumple(a.periodoInicio)).map((a) => a.monto));

const reducciones = (celdas: readonly Celda[], clase: Celda['clase']): Centavos =>
  suma(celdas.filter((x) => x.clase === clase).map(reduccionDe));

function listoParaAsignar(
  h: HechosDeLpa,
  b: Presupuesto,
  cobros: readonly PorCobrar[],
): DetalleLpa {
  const a = b.activo.inicio;
  const cerradas = b.celdas.filter((x) => x.estado === 'cerrado');
  const detalle = {
    entradas: entradas(h, cobros),
    asignadoCerrados: asignadoSi(h, (p) => p < a),
    asignadoActivo: asignadoSi(h, (p) => p === a),
    asignadoFuturos: asignadoSi(h, (p) => p > a),
    sobregirosDebito: reducciones(cerradas, 'normal'),
    pagosExcedentes: reducciones(cerradas, 'pago'),
    dineroEnCamino: dineroEnCamino(cobros),
  };
  const restado = suma([
    detalle.asignadoCerrados,
    detalle.asignadoActivo,
    detalle.asignadoFuturos,
    detalle.sobregirosDebito,
    detalle.pagosExcedentes,
    detalle.dineroEnCamino,
  ]);
  return { ...detalle, total: Centavos.restar(detalle.entradas.total, restado) };
}

function lpaAlCierre(h: HechosDeLpa, b: Presupuesto, p: Periodo): Centavos {
  const cobros = porCobrar(h, p.fin);
  const hasta = b.celdas.filter((x) => x.periodo.inicio <= p.inicio);
  const restado = suma([
    asignadoSi(h, (q) => q <= p.inicio),
    reducciones(hasta, 'normal'),
    reducciones(hasta, 'pago'),
    dineroEnCamino(cobros),
  ]);
  return Centavos.restar(entradas(h, cobros, p.fin).total, restado);
}

// metas.ts
function fechaObjetivo(m: Meta, p: Periodo): FechaLocal {
  if (m.tipo === 'para_fecha') {
    if (m.fechaObjetivo === null) throw new RangeError(`la meta ${m.id} no tiene fecha objetivo`);
    return m.fechaObjetivo;
  }
  if (m.tipo !== 'anual') throw new RangeError(`la meta ${m.id} es ${m.tipo}: no tiene FO`);
  const fo0 = m.fechaObjetivo ?? FechaLocal.sumarAnios(m.fechaCreacion, 1);
  const anios = FechaLocal.partes(p.inicio).anio - FechaLocal.partes(fo0).anio - 1;
  let k = Math.max(0, anios);
  while (FechaLocal.sumarAnios(fo0, k) < p.inicio) k += 1;
  return FechaLocal.sumarAnios(fo0, k);
}

function valoresEn(
  b: Presupuesto,
  categoriaId: Uuid,
  p: Periodo,
): Pick<Celda, 'arrastre' | 'actividad' | 'asignado' | 'disponible'> {
  const propias = b.celdas.filter((x) => x.categoriaId === categoriaId);
  const ultima = propias[propias.length - 1];
  if (ultima === undefined) throw new RangeError(`la categoría ${categoriaId} no tiene celdas`);
  const x = propias.find((y) => y.periodo.inicio === p.inicio);
  if (x !== undefined) return x;
  const arrastre = p.inicio > ultima.periodo.inicio ? positivo(ultima.disponible) : Centavos.cero;
  return { arrastre, asignado: Centavos.cero, actividad: Centavos.cero, disponible: arrastre };
}

function evaluarMeta(
  m: Meta,
  categoria: Pick<Categoria, 'id' | 'archivada'>,
  b: Presupuesto,
  c: Ciclo,
  hoy: FechaLocal,
  p: Periodo = b.activo,
): EvaluacionDeMeta | null {
  if (categoria.id !== m.categoriaId)
    throw new RangeError(`la meta ${m.id} no es de la categoría ${categoria.id}`);
  if (categoria.archivada) return null;
  if (p.inicio < b.activo.inicio) throw new RangeError(`el período ${p.inicio} está cerrado`);
  const x = valoresEn(b, m.categoriaId, p);
  const base = Centavos.sumar(x.arrastre, x.actividad);
  let montoDelPeriodo: Centavos | null = null;
  let fo: FechaLocal | null = null;
  let n: number | null = null;
  let pedido: Centavos;
  let estado: EstadoDeMeta | null = null;
  if (m.tipo === 'mensual' || m.tipo === 'semanal') {
    const monto =
      m.tipo === 'mensual' ? m.monto : Centavos.metaSemanalDelPeriodo(m.monto, duracion(p));
    pedido = m.modo === 'rellenar_hasta' ? positivo(Centavos.restar(monto, x.arrastre)) : monto;
    montoDelPeriodo = monto;
  } else {
    fo = fechaObjetivo(m, p);
    n = p.inicio > fo ? 1 : periodosEntre(c, p.inicio, fo).length;
    const alcanza = (q: Periodo) => valoresEn(b, m.categoriaId, q).disponible >= m.monto;
    estado = alcanza(b.activo) ? 'cumplida' : 'en_curso';
    if (m.tipo === 'para_fecha' && hoy > fo)
      estado = estado === 'cumplida' || alcanza(periodoDe(c, fo)) ? 'completada' : 'vencida';
    pedido =
      estado === 'completada'
        ? Centavos.cero
        : Centavos.cuotaConTecho(positivo(Centavos.restar(m.monto, base)), n);
  }
  const falta = positivo(Centavos.restar(pedido, x.asignado));
  estado ??= falta > 0 ? 'con_faltante' : 'cubierta';
  return {
    periodo: p,
    base,
    asignado: x.asignado,
    montoDelPeriodo,
    fechaObjetivo: fo,
    periodosRestantes: n,
    pedido,
    falta,
    estado,
  };
}

// ocurrencias.ts
function intervalo(p: ReglaDeOcurrencia): number | null {
  if (p.frecuencia === 'semanal') return 7;
  if (p.frecuencia === 'quincenal') return 14;
  if (p.frecuencia !== 'cada_n_dias') return null;
  const n = p.frecuenciaDias;
  if (n === null || !Number.isInteger(n) || n < 1)
    throw new RangeError(`frecuencia cada N días sin un N válido: ${n}`);
  return n;
}

function fechaDeOcurrencia(p: ReglaDeOcurrencia, k: number): FechaLocal {
  const dias = intervalo(p);
  if (dias !== null) return FechaLocal.sumarDias(p.primeraFecha, k * dias);
  return p.frecuencia === 'mensual'
    ? FechaLocal.sumarMeses(p.primeraFecha, k)
    : FechaLocal.sumarAnios(p.primeraFecha, k);
}

function ocurrencias(
  p: ReglaDeOcurrencia & Pick<Programada, 'fechaFin' | 'activa' | 'reactivadaDesde'>,
  hasta: FechaLocal,
): FechaLocal[] {
  if (!p.activa) return [];
  const tope = p.fechaFin !== null && p.fechaFin < hasta ? p.fechaFin : hasta;
  const desde = p.reactivadaDesde;
  const fechas: FechaLocal[] = [];
  for (let k = 0, f = p.primeraFecha; f <= tope; k += 1, f = fechaDeOcurrencia(p, k))
    if (desde === null || !(f < desde)) fechas.push(f);
  return fechas;
}

const claveOcurrencia = (x: OcurrenciaPendiente) => `${x.fecha}|${x.programadaId}`;

function pendientes(
  h: Pick<Hechos, 'programadas' | 'ocurrencias_resueltas'>,
  hoy: FechaLocal,
  horizonteDias: number,
): OcurrenciaPendiente[] {
  const resueltas = new Set(
    h.ocurrencias_resueltas.map((r) => `${r.programadaId}|${r.fechaEsperada}`),
  );
  const hasta = FechaLocal.sumarDias(hoy, horizonteDias);
  return h.programadas
    .flatMap((p) =>
      ocurrencias(p, hasta)
        .filter((fecha) => !resueltas.has(`${p.id}|${fecha}`))
        .map((fecha) => ({ programadaId: p.id, fecha, atrasada: fecha < hoy })),
    )
    .sort((a, b) => (claveOcurrencia(a) < claveOcurrencia(b) ? -1 : 1));
}

// patrimonio.ts, sobregiros.ts y tarjetas.ts
function patrimonioNeto(
  h: HechosDeSaldo & Pick<Hechos, 'cuentas'>,
  cobros: readonly PorCobrar[],
): PatrimonioNeto {
  const de = (tipo: string, valor: (h: HechosDeSaldo, id: Uuid) => Centavos) =>
    suma(h.cuentas.filter((k) => k.tipo === tipo).map((k) => valor(h, k.id)));
  const x = {
    efectivo: de('efectivo', saldo),
    saldosAFavor: de('tarjeta', saldoAFavor),
    inversiones: de('inversion', saldo),
    porCobrar: porCobrarAbierto(cobros),
    deudasDeTarjeta: de('tarjeta', deuda),
    prestamos: de('prestamo', capitalPendiente),
  };
  const activos = suma([x.efectivo, x.saldosAFavor, x.inversiones, x.porCobrar]);
  return { ...x, total: Centavos.restar(activos, Centavos.sumar(x.deudasDeTarjeta, x.prestamos)) };
}

const delActivo = (b: Presupuesto) => b.celdas.filter((x) => x.periodo.inicio === b.activo.inicio);
const pagoExcedente = (x: Celda): Centavos => (x.clase === 'pago' ? x.reinicio : Centavos.cero);
const sobregiroConTarjetaDelActivo = (b: Presupuesto): Centavos =>
  suma(delActivo(b).map((x) => x.sobT));
const reduccionProyectada = (b: Presupuesto): Centavos => suma(delActivo(b).map(reduccionDe));

function estadoDeTarjeta(h: HechosDeSaldo, b: Presupuesto, tarjetaId: Uuid): EstadoDeTarjeta {
  const pago = b.celdas.find(
    (x) => x.clase === 'pago' && x.tarjetaId === tarjetaId && x.periodo.inicio === b.activo.inicio,
  );
  if (pago === undefined)
    throw new RangeError(`la tarjeta ${tarjetaId} no tiene categoría de pago`);
  const d = deuda(h, tarjetaId);
  const reservado = Centavos.max(Centavos.cero, pago.disponible);
  return {
    tarjetaId,
    deuda: d,
    disponibleDePago: pago.disponible,
    reservado,
    sinRespaldo: Centavos.max(Centavos.cero, Centavos.restar(d, reservado)),
    reservaExcedente: Centavos.max(Centavos.cero, Centavos.restar(reservado, d)),
    pagoExcedente: pagoExcedente(pago),
  };
}

// clasificacion.ts
const POR_TOTAL: Partial<Record<TipoTransaccion, ClaseDeReporte>> = {
  ingreso: 'ingreso',
  entrada_tarjeta: 'ingreso',
  desembolso_prestamo: 'otras_entradas',
  retiro_inversion: 'otras_entradas',
  avance_efectivo: 'otras_entradas',
  pago_tarjeta: 'neutral',
  transferencia: 'neutral',
  transferencia_tarjetas: 'neutral',
};

function clasificacion(h: HechosDeConsumo, c: Ciclo, cobros: readonly PorCobrar[]): Clasificacion {
  const txs = new Map(h.transacciones.map((t) => [t.id, t]));
  const partidas: Partida[] = [];
  const agregar = (
    x: Pick<Partida, 'id' | 'fecha'>,
    clase: ClaseDeReporte,
    monto: Centavos,
    cat: Uuid | null = null,
  ) => partidas.push({ id: x.id, fecha: x.fecha, clase, categoriaId: cat, monto });
  for (const t of h.transacciones) {
    const clase = POR_TOTAL[t.tipo];
    if (clase !== undefined) agregar(t, clase, t.total);
  }
  for (const e of h.efectos) {
    const t = txs.get(e.transaccionId);
    if (t?.tipo === 'saldo_inicial') agregar(t, 'saldo_inicial', e.monto);
  }
  for (const e of cobros.flatMap((x) => x.eventos.filter((y) => y.tipo === 'cobro'))) {
    if (e.restituido > 0) agregar(e, 'restitucion', e.restituido);
    if (e.excedente > 0) agregar(e, 'ingreso', e.excedente);
  }
  for (const k of consumosAntes(h, c)) agregar(k, 'gasto', k.neto, k.categoriaId);
  for (const d of clasificarAntes(h, c))
    if (d.caso !== 'D-1')
      agregar({ id: d.lineaId, fecha: d.fecha }, 'gasto', Centavos.negar(d.monto), d.categoriaId);
  const costosFinancieros: Clasificacion['costosFinancieros'][number][] = [];
  for (const e of h.efectos) {
    const t = txs.get(e.transaccionId);
    if (t?.tipo !== 'cuota_prestamo' || (e.interes === null && e.seguro === null)) continue;
    costosFinancieros.push({
      transaccionId: t.id,
      fecha: t.fecha,
      prestamoId: e.cuentaId,
      categoriaId: h.lineas.find((l) => l.transaccionId === t.id)?.categoriaId ?? null,
      interes: e.interes ?? Centavos.cero,
      seguro: e.seguro ?? Centavos.cero,
    });
  }
  return { partidas, costosFinancieros };
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

// El generador de volumen de TA-156 (#123), sin pasar por el tsconfig del paquete.
type Generador = {
  generarHechos: (op: { nivel: 'base' | 'alto'; anios: number; semilla: number }) => Hechos;
  fechaFinal: (op: { anios: number }) => FechaLocal;
};
const generador = Object.values(
  import.meta.glob<Generador>('../../../../tools/pruebas/volumen/generar.ts', { eager: true }),
)[0];

/**
 * Cada devolución vinculada, repetida 40 y 80 días después: D-3 de una misma L en varios períodos,
 * para que A_L acumule las partes a de períodos anteriores. Y cada cobro, repetido 10 días después:
 * un segundo cobro de la misma línea, que restituye solo lo que queda abierto.
 */
function conRepetidas(h: Hechos): Hechos {
  // Las de un por cobrar no: repetidas superarían su saldo abierto (inv. 9).
  const porCobrarL = new Set(h.lineas.filter((l) => l.deudorId !== null).map((l) => l.id));
  const deCobro = (l: Linea) => l.lineaOriginalId !== null && porCobrarL.has(l.lineaOriginalId);
  const conCobro = new Set(h.lineas.filter(deCobro).map((l) => l.transaccionId));
  const vinculadas = new Set(
    h.lineas
      .filter((l) => l.lineaOriginalId !== null && !conCobro.has(l.transaccionId))
      .map((l) => l.transaccionId),
  );
  // Un cobro se repite solo si su línea no tiene devoluciones ni condonaciones, por la misma razón.
  const conEventos = new Set([
    ...h.condonaciones.map((x) => x.lineaId),
    ...h.lineas.filter(deCobro).map((l) => l.lineaOriginalId),
  ]);
  const repite = (t: Transaccion) =>
    t.tipo === 'devolucion' && vinculadas.has(t.id)
      ? [40, 80]
      : t.tipo === 'cobro' && !conEventos.has(t.lineaCobradaId)
        ? [10]
        : [];
  const copias = h.transacciones.flatMap((t) =>
    repite(t).map((dias) => ({ t, dias, sufijo: `-r${dias}` })),
  );
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

/** Las filas de cada tabla en orden inverso: `canonicos` tiene que ordenarlas (inv. 26). */
const invertidos = (h: Hechos): Hechos =>
  Object.fromEntries(
    (Object.keys(h) as TablaMotor[]).map((t) => [t, [...h[t]].reverse()]),
  ) as unknown as Hechos;

/**
 * Las dos implementaciones dan lo mismo en `hoy` y más adelante, cuando los períodos de los hechos
 * ya cerraron: así el historial de LPA recorre los cobros y el dinero en camino de cada cierre.
 */
function iguales(h: Hechos, hoy: FechaLocal) {
  for (const dias of [0, 45, 400]) {
    const despues = FechaLocal.sumarDias(hoy, dias);
    expect(calcular(h, despues)).toStrictEqual(calcularAntes(h, despues));
  }
  const repetidas = conRepetidas(h);
  const despues = FechaLocal.sumarDias(hoy, 120);
  if (repetidas.transacciones.length > h.transacciones.length)
    expect(calcular(repetidas, despues)).toStrictEqual(calcularAntes(repetidas, despues));
}

/** Un volumen de 07 §12.7 en su fecha final, con las filas en su orden y en orden inverso. */
function igualesEnVolumen(g: Generador, nivel: 'base' | 'alto', anios: number, semilla: number) {
  const h = g.generarHechos({ nivel, anios, semilla });
  const hoy = g.fechaFinal({ anios });
  const esperado = calcularAntes(h, hoy);
  expect(calcular(h, hoy), `${nivel} ${anios} años, semilla ${semilla}`).toStrictEqual(esperado);
  expect(calcular(invertidos(h), hoy), `${nivel} ${anios} años invertido`).toStrictEqual(esperado);
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
  it('PRU-PROP-MOTOR-108 [INV-26] calcular con índices por celda (BE-23) da la misma instantánea que la implementación anterior, sobre hechosArb, operacionesArb, los escenarios y el volumen base a 2 años y alto a 3 y 10 años (04 §2.4, §5.6)', async () => {
    fc.assert(
      fc.property(casoArb, ({ hoy, h }) => {
        iguales(h, hoy);
        expect(calcular(invertidos(h), hoy)).toStrictEqual(calcularAntes(h, hoy));
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
    // El volumen de 07 §12.7 (#123): base a 2 años con la semilla de la corrida y alto a 3 años con
    // las semillas 2 y 3; el alto a 10 años (semilla 1, la de PRU-REN-MOTOR-101), en el nocturno.
    expect(generador, 'tools/pruebas/volumen/generar.ts').toBeDefined();
    if (generador === undefined) return;
    igualesEnVolumen(generador, 'base', 2, opciones.seed);
    for (const semilla of [2, 3]) igualesEnVolumen(generador, 'alto', 3, semilla);
    if (NOCTURNO) igualesEnVolumen(generador, 'alto', 10, 1);
  }, 600_000);
});

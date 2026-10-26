// Ejecutor `motor` de los escenarios (07 §12.3; portado del prototipo de V7-08): traduce cada operación del dato a un
// comando de dominio, la aplica con `aplicar` a los hechos en memoria y observa con `calcular`.
// Convenciones de completado (DP-16): hoy del paso, fecha de la transacción = hoy, hora de registro hoy 12:00 más un
// minuto por operación, apertura 21/01/2027, tarjetas con límite $5,000 y corte 15, grupo "Gastos", saldo inicial 0.
import { aplicar, avisosDeEstado, calcular } from '../src/index';
import type { ComandoDominio, Hechos, Instantanea, Instante, Uuid } from '../src/index';
import { Centavos, FechaLocal } from '../src/valores/index';
import type { Ejecutor } from './ejecutar';
import {
  type Escenario,
  type Observado,
  type Op,
  PERIODOS,
  type Paso,
  type Periodo,
  usd,
} from './tipos';

export interface Estado {
  hechos: Hechos;
  hoy: FechaLocal;
  contador: number; // ids de filas nuevas, deterministas
  reloj: number; // operaciones aplicadas: da el minuto de registro (orden D2)
}

const id = (t: string) => t as Uuid;
const c = (dolares: number) => Centavos.desdeEntero(usd(dolares));
const pad = (n: number) => String(n).padStart(2, '0');
const GASTOS = id('grupo-gastos');

/** 'AAAA-MM-DDThh:mm' local (UTC−6, sin horario de verano) a instante UTC. */
function instante(local: string): Instante {
  const [dia = '', hm = ''] = local.split('T');
  const [h = 0, m = 0] = hm.split(':').map(Number);
  const fecha = h + 6 >= 24 ? FechaLocal.sumarDias(FechaLocal.desdeTexto(dia), 1) : dia;
  return `${fecha}T${pad((h + 6) % 24)}:${pad(m)}:00.000Z` as Instante;
}

type Grupo = Hechos['grupos'][number];
const grupo = (orden: number, nombre: string, claveSistema: string | null): Grupo => ({
  id: claveSistema ? id('grupo-pagos') : GASTOS,
  nombre,
  orden,
  archivado: false,
  claveSistema,
  revision: null,
});
export function sembrar(hoy: string): Estado {
  const vigencia = { id: id('vigencia-1'), diaInicio: 21, rigeDesde: null, revision: null };
  const hechos: Hechos = {
    vigencias_ciclo: [vigencia],
    grupos: [grupo(1, 'Pagos de tarjeta', 'pagos_tarjeta'), grupo(2, 'Gastos', null)],
    cuentas: [],
    tarjetas: [],
    prestamos: [],
    inversiones: [],
    categorias: [],
    asignaciones: [],
    deudores: [],
    transacciones: [],
    efectos: [],
    lineas: [],
    condonaciones: [],
    metas: [],
    programadas: [],
    programada_lineas: [],
    ocurrencias_resueltas: [],
    conciliaciones: [],
  };
  return { hechos, hoy: FechaLocal.desdeTexto(hoy), contador: 0, reloj: 0 };
}

const cuentaId = (s: Estado, nombre: string) => {
  const k = s.hechos.cuentas.find((x) => x.nombre === nombre);
  if (!k) throw new Error(`el dato nombra una cuenta que no existe: ${nombre}`);
  return k.id;
};

/** Nombre con que 01 §8 llama a una categoría: la de pago de la tarjeta T es "Pago T". */
function nombresDeCategorias(h: Hechos): Map<Uuid, string> {
  const cuentas = new Map(h.cuentas.map((k) => [k.id, k.nombre]));
  return new Map(
    h.categorias.map((x) => [x.id, x.tarjetaId ? `Pago ${cuentas.get(x.tarjetaId)}` : x.nombre]),
  );
}
const categoriaId = (s: Estado, nombre: string) => {
  for (const [k, v] of nombresDeCategorias(s.hechos)) if (v === nombre) return k;
  throw new Error(`el dato nombra una categoría que no existe: ${nombre}`);
};

/** Comando de dominio de una operación del dato; avanza el reloj y el contador del estado. */
function comando(s: Estado, op: Op): ComandoDominio {
  const ids = { siguiente: () => id(`n${++s.contador}`) };
  const minutos = 12 * 60 + ++s.reloj;
  const hora = (registrado?: string) =>
    instante(registrado ?? `${s.hoy}T${pad(Math.floor(minutos / 60))}:${pad(minutos % 60)}`);
  const fecha = (f?: string) => FechaLocal.desdeTexto(f ?? s.hoy);
  switch (op.op) {
    case 'OP-01': {
      const { tipo = 'efectivo', prestamo: p } = op;
      if (tipo === 'prestamo' && !p)
        throw new Error(`OP-01: ${op.cuenta} no trae datos de préstamo`);
      const comunes = { tasaNominalAnualMillonesimas: null, seguroPrimerMes: null, comision: null };
      const subtipo =
        tipo === 'tarjeta'
          ? {
              tipo,
              limiteCredito: c(5000),
              tasaAnualMillonesimas: null,
              diaCorte: op.diaCorte ?? 15,
            }
          : p && {
              ...comunes,
              tipo,
              contraparte: p.contraparte,
              montoOriginal: c(p.montoOriginal),
              tipoTasa: 'fija',
              frecuencia: 'mensual',
              frecuenciaDias: null,
              modeloCalculo: null,
              cuotaPactada: c(p.cuota),
              plazoCuotas: p.plazoCuotas,
              cuotasPagadasAlCrear: p.cuotasPagadas,
            };
      const cuenta = { tipo, nombre: op.cuenta, institucionId: null, ultimos4: null };
      return {
        operacion: 'OP-01',
        id: id(`cuenta-${op.cuenta}`),
        instante: hora(),
        ids,
        saldo: c(op.saldo ?? 0),
        cuenta: { ...cuenta, fechaApertura: fecha(op.apertura ?? '2027-01-21') },
        ...(subtipo && { subtipo: { diaPago: 5, red: null, color: null, ...subtipo } }),
      } as ComandoDominio;
    }
    case 'OP-07':
      return {
        operacion: 'OP-07',
        id: id(`categoria-${op.categoria}`),
        tipo: 'categoria',
        nombre: op.categoria,
        grupoId: GASTOS,
      };
    case 'OP-14': {
      const inicio = calcular(s.hechos, s.hoy).presupuesto.activo.inicio;
      const periodoInicio = FechaLocal.desdeTexto(op.periodo ? PERIODOS[op.periodo] : inicio);
      const cat = categoriaId(s, op.categoria);
      const propia = (a: Hechos['asignaciones'][number]) =>
        a.categoriaId === cat && a.periodoInicio === periodoInicio;
      const actual = s.hechos.asignaciones.find(propia)?.monto ?? Centavos.cero;
      const montoNuevo = Centavos.sumar(actual, c(op.monto));
      return { operacion: 'OP-14', categoriaId: cat, periodoInicio, montoNuevo, ids };
    }
    case 'OP-21':
      return {
        operacion: 'OP-21',
        id: id(`t${++s.contador}`),
        instante: hora(op.registrado),
        ids,
        fecha: fecha(op.fecha),
        total: c(op.monto),
        cuentaId: cuentaId(s, op.cuenta ?? 'Ahorro'),
      };
  }
}

/** Columnas fuera de la instantánea (regla 9) que `motor` evalúa; el argumento va después de ':'. */
const EXTRAS: Record<string, (i: Instantanea, arg: string) => number> = {
  patrimonio: (i) => i.patrimonio.total,
  lpaCierre: (i, p) => {
    const x = i.historialLpa.find((y) => y.periodo.inicio === PERIODOS[p as Periodo]);
    if (!x) throw new Error(`lpaCierre:${p}: el período no está cerrado`);
    return x.lpa;
  },
  arrastre: (i, p) =>
    i.presupuesto.celdas
      .filter((x) => x.periodo.inicio === PERIODOS[p as Periodo])
      .reduce((a, x) => a + x.arrastre, 0),
  efAl: (i, fecha) => {
    const efectivo = new Set(
      i.hechos.cuentas.filter((k) => k.tipo === 'efectivo').map((k) => k.id),
    );
    const hasta = new Set(i.hechos.transacciones.filter((t) => t.fecha <= fecha).map((t) => t.id));
    const suyos = i.hechos.efectos.filter(
      (e) => efectivo.has(e.cuentaId) && hasta.has(e.transaccionId),
    );
    return suyos.reduce((a, e) => a + e.monto, 0);
  },
};

function observar(s: Estado, claves: string[], avisos: Set<string>): Observado {
  const i = calcular(s.hechos, s.hoy);
  const nombres = nombresDeCategorias(i.hechos);
  const cuentas = new Map(i.hechos.cuentas.map((k) => [k.id, k.nombre]));
  const disp: Observado['disp'] = {};
  const activo = i.presupuesto.activo.inicio;
  for (const x of i.presupuesto.celdas)
    if (x.periodo.inicio === activo) disp[nombres.get(x.categoriaId) as string] = x.disponible;
  const tarjetas: Observado['tarjetas'] = {};
  for (const t of i.tarjetas)
    tarjetas[cuentas.get(t.tarjetaId) as string] = [t.deuda, t.sinRespaldo, t.reservaExcedente];
  for (const a of avisosDeEstado(i)) avisos.add(a.aviso);
  const extra: Observado['extra'] = {};
  for (const k of claves) {
    const [nombre = '', arg = ''] = k.split(/:(.*)/s);
    const f = EXTRAS[nombre];
    if (f) extra[k] = f(i, arg);
  }
  const ef = i.cuentas.filter((k) => k.tipo === 'efectivo').reduce((a, k) => a + k.saldo, 0);
  const [lpa, fut, sobta] = [i.lpa.total, i.lpa.asignadoFuturos, i.sobregiroConTarjeta];
  return { ef, lpa, disp, fut, sobta, tarjetas, avisos: [...avisos].sort(), extra };
}

/** Forma canónica de la instantánea completa, para comprobar que un rechazo no cambia nada (regla 7). */
const huella = (s: Estado) => JSON.stringify(calcular(s.hechos, s.hoy));

export const ejecutorMotor: Ejecutor<Estado> = {
  nombre: 'motor',
  iniciar(e: Escenario, hoy: string) {
    const s = sembrar(hoy);
    for (const op of e.estadoInicial ?? []) {
      const r = aplicar(s.hechos, comando(s, op), s.hoy);
      if (!r.ok)
        throw new Error(`${e.id}: el estado inicial se rechazó (${r.rechazos[0]?.codigo})`);
      s.hechos = r.hechosNuevos;
    }
    return Promise.resolve(s);
  },
  // Los hechos son inmutables (cada operación entrega otros): basta copiar el estado.
  bifurcar: (s: Estado) => Promise.resolve({ ...s }),
  paso(s: Estado, p: Paso) {
    if (p.hoy) s.hoy = FechaLocal.desdeTexto(p.hoy);
    const [antes, previa, avisos] = [{ ...s }, huella(s), new Set<string>()];
    let rechazo: string | undefined;
    for (const op of p.ops) {
      const r = aplicar(s.hechos, comando(s, op), s.hoy);
      if (!r.ok) {
        rechazo = r.rechazos[0]?.codigo ?? 'sin_codigo';
        break;
      }
      s.hechos = r.hechosNuevos;
      for (const a of r.avisos) avisos.add(a.codigo);
    }
    if (rechazo !== undefined) Object.assign(s, antes); // atomicidad: la fila entera se descarta (01 §5.0.1)
    const obs = observar(s, Object.keys(p.espera.extra ?? {}), avisos);
    return Promise.resolve(
      rechazo === undefined ? obs : { ...obs, rechazo, intacto: huella(s) === previa },
    );
  },
  terminar: () => Promise.resolve(),
};

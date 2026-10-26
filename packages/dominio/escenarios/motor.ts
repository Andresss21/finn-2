// Ejecutor `motor` de los escenarios (07 §12.3; portado del prototipo de V7-08): traduce cada operación del dato a un
// comando de dominio, la aplica con `aplicar` a los hechos en memoria y observa con `calcular`.
// Convenciones de completado (DP-16): hoy del paso, fecha de la transacción = hoy, hora de registro hoy 12:00 más un
// minuto por operación, apertura 21/01/2027, tarjetas con límite $5,000 y corte 15, grupo "Gastos", saldo inicial 0.
import { aplicar, avisosDeEstado, calcular } from '../src/index';
import type { ComandoDominio, Hechos, Instantanea, Instante, Uuid } from '../src/index';
import { Centavos, FechaLocal } from '../src/valores/index';
import type { Ejecutor } from './ejecutar';
import { type Escenario, type Observado, type Op, PERIODOS, type Paso, usd } from './tipos';

export interface Estado {
  hechos: Hechos;
  hoy: FechaLocal;
  contador: number; // ids de filas nuevas, deterministas
  reloj: number; // operaciones aplicadas: da el minuto de registro (orden D2)
  refs: Record<string, Uuid>; // ref del dato → transacción
}

const id = (t: string) => t as Uuid;
const c = (dolares: number) => Centavos.desdeEntero(usd(dolares));
const pad = (n: number) => String(n).padStart(2, '0');
const GASTOS = id('grupo-gastos');

/** 'AAAA-MM-DDThh:mm' local (UTC−6, sin horario de verano) a instante UTC. */
function instante(local: string): Instante {
  const [dia = '', hm = ''] = local.split('T');
  const [h = 0, m = 0] = hm.split(':').map(Number);
  const u = h + 6;
  const fecha = u >= 24 ? FechaLocal.sumarDias(FechaLocal.desdeTexto(dia), 1) : dia;
  return `${fecha}T${pad(u % 24)}:${pad(m)}:00.000Z` as Instante;
}

/** Los hechos son inmutables (cada operación entrega otros): basta copiar lo que se reasigna. */
const clonar = (s: Estado): Estado => ({ ...s, refs: { ...s.refs } });

export function sembrar(hoy: string): Estado {
  const vacio = (): Hechos => ({
    vigencias_ciclo: [{ id: id('vigencia-1'), diaInicio: 21, rigeDesde: null, revision: null }],
    cuentas: [],
    tarjetas: [],
    prestamos: [],
    inversiones: [],
    grupos: [
      {
        id: id('grupo-pagos'),
        nombre: 'Pagos de tarjeta',
        orden: 1,
        archivado: false,
        claveSistema: 'pagos_tarjeta',
        revision: null,
      },
      {
        id: GASTOS,
        nombre: 'Gastos',
        orden: 2,
        archivado: false,
        claveSistema: null,
        revision: null,
      },
    ],
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
  });
  return { hechos: vacio(), hoy: FechaLocal.desdeTexto(hoy), contador: 0, reloj: 0, refs: {} };
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
  const nuevo = () => id(`t${++s.contador}`);
  s.reloj++;
  const minutos = 12 * 60 + s.reloj;
  const hora = (registrado?: string) =>
    instante(registrado ?? `${s.hoy}T${pad(Math.floor(minutos / 60))}:${pad(minutos % 60)}`);
  const fecha = (f?: string) => FechaLocal.desdeTexto(f ?? s.hoy);
  switch (op.op) {
    case 'OP-01': {
      const tipo = op.tipo ?? 'efectivo';
      const p = op.prestamo;
      const subtipo =
        tipo === 'tarjeta'
          ? {
              tipo,
              limiteCredito: c(5000),
              tasaAnualMillonesimas: null,
              diaCorte: op.diaCorte ?? 15,
              diaPago: 5,
              red: null,
              color: null,
            }
          : tipo === 'prestamo' && p
            ? {
                tipo,
                contraparte: p.contraparte,
                montoOriginal: c(p.montoOriginal),
                tasaNominalAnualMillonesimas: null,
                tipoTasa: 'fija',
                seguroPrimerMes: null,
                comision: null,
                frecuencia: 'mensual',
                frecuenciaDias: null,
                cuotaPactada: c(p.cuota),
                plazoCuotas: p.plazoCuotas,
                modeloCalculo: null,
                cuotasPagadasAlCrear: p.cuotasPagadas,
              }
            : undefined;
      if (tipo === 'prestamo' && !p)
        throw new Error(`OP-01: el préstamo ${op.cuenta} no trae sus datos`);
      return {
        operacion: 'OP-01',
        id: id(`cuenta-${op.cuenta}`),
        instante: hora(),
        ids,
        saldo: c(op.saldo ?? 0),
        cuenta: {
          tipo,
          nombre: op.cuenta,
          institucionId: null,
          ultimos4: null,
          fechaApertura: fecha(op.apertura ?? '2027-01-21'),
        },
        ...(subtipo && { subtipo }),
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
      const periodoInicio = FechaLocal.desdeTexto(
        op.periodo ? PERIODOS[op.periodo] : calcular(s.hechos, s.hoy).presupuesto.activo.inicio,
      );
      const cat = categoriaId(s, op.categoria);
      const actual =
        s.hechos.asignaciones.find(
          (a) => a.categoriaId === cat && a.periodoInicio === periodoInicio,
        )?.monto ?? 0;
      return {
        operacion: 'OP-14',
        categoriaId: cat,
        periodoInicio,
        montoNuevo: Centavos.sumar(Centavos.desdeEntero(actual), c(op.monto)),
        ids,
      };
    }
    case 'OP-20': {
      const total = op.lineas.reduce((a, [, m]) => a + m, 0);
      const tx = nuevo();
      s.refs[op.ref] = tx;
      return {
        operacion: 'OP-20',
        id: tx,
        instante: hora(op.registrado),
        ids,
        fecha: fecha(op.fecha),
        total: c(total),
        cuentaId: cuentaId(s, op.cuenta),
        lineas: op.lineas.map(([cat, m]) => ({
          monto: c(m),
          destino: { categoriaId: categoriaId(s, cat) },
        })),
      };
    }
    case 'OP-21':
      return {
        operacion: 'OP-21',
        id: nuevo(),
        instante: hora(op.registrado),
        ids,
        fecha: fecha(op.fecha),
        total: c(op.monto),
        cuentaId: cuentaId(s, op.cuenta ?? 'Ahorro'),
      };
    case 'OP-23':
      return {
        operacion: 'OP-23',
        id: nuevo(),
        instante: hora(op.registrado),
        ids,
        fecha: fecha(op.fecha),
        total: c(op.monto),
        origenId: cuentaId(s, 'Ahorro'),
        tarjetaId: cuentaId(s, op.tarjeta),
      };
  }
}

/** Columnas fuera de la instantánea (regla 9) que `motor` evalúa; el argumento va después de ':'. */
const EXTRAS: Record<string, (i: Instantanea, arg: string) => number> = {
  patrimonio: (i) => i.patrimonio.total,
  lpaCierre: (i, p) => {
    const x = i.historialLpa.find((y) => y.periodo.inicio === PERIODOS[p as keyof typeof PERIODOS]);
    if (!x) throw new Error(`lpaCierre:${p}: el período no está cerrado`);
    return x.lpa;
  },
  arrastre: (i, p) =>
    i.presupuesto.celdas
      .filter((x) => x.periodo.inicio === PERIODOS[p as keyof typeof PERIODOS])
      .reduce((a, x) => a + x.arrastre, 0),
  efAl: (i, fecha) => {
    const efectivo = new Set(
      i.hechos.cuentas.filter((k) => k.tipo === 'efectivo').map((k) => k.id),
    );
    const hasta = new Set(i.hechos.transacciones.filter((t) => t.fecha <= fecha).map((t) => t.id));
    return i.hechos.efectos
      .filter((e) => efectivo.has(e.cuentaId) && hasta.has(e.transaccionId))
      .reduce((a, e) => a + e.monto, 0);
  },
};
export const EVALUA_MOTOR: ReadonlySet<string> = new Set(Object.keys(EXTRAS));

export function observar(
  s: Estado,
  claves: string[],
  avisos: Set<string>,
  rechazo?: string,
  intacto?: boolean,
): Observado {
  const i = calcular(s.hechos, s.hoy);
  const nombres = nombresDeCategorias(i.hechos);
  const cuentas = new Map(i.hechos.cuentas.map((k) => [k.id, k.nombre]));
  const activo = i.presupuesto.activo.inicio;
  const disp: Observado['disp'] = {};
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
  return {
    ef,
    lpa: i.lpa.total,
    disp,
    fut: i.lpa.asignadoFuturos,
    sobta: i.sobregiroConTarjeta,
    tarjetas,
    avisos: [...avisos].sort(),
    extra,
    ...(rechazo !== undefined && { rechazo }),
    ...(intacto !== undefined && { intacto }),
  };
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
  bifurcar(s: Estado) {
    return Promise.resolve(clonar(s));
  },
  paso(s: Estado, p: Paso) {
    if (p.hoy) s.hoy = FechaLocal.desdeTexto(p.hoy);
    const antes = clonar(s);
    const previa = huella(s);
    const avisos = new Set<string>();
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
    const claves = Object.keys(p.espera.extra ?? {});
    const intacto = rechazo === undefined ? undefined : huella(s) === previa;
    return Promise.resolve(observar(s, claves, avisos, rechazo, intacto));
  },
  terminar: () => Promise.resolve(),
};

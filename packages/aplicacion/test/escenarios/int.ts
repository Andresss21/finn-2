// Ejecutor `int` de los escenarios (TA-188; 07 §12.3; portado del prototipo de V7-08): cada operación del dato es la
// operación real de @finn/aplicacion (`confirmar` del marco, con el protocolo de 04 §4.2) contra PostgreSQL como
// `finn_app`, con el reloj simulado de cada operación; la lectura es la consulta (`consultar` y las consultas de 04 §6),
// que carga los hechos (o los toma de la memoria) y calcula con el mismo núcleo que `motor`.
// Una base por escenario (clonada de la plantilla) y una más por cada fila de contraste (clonada del estado anterior).
import { randomUUID } from 'node:crypto';
import { avisosDeEstado, type Instantanea, type Uuid } from '@finn/dominio';
import { Memoria, registrarEvento, type OpcionesTx } from '@finn/db';
import { crearCliente, type Cliente } from '../../../db/src/cliente.ts';
import { transaccionesSobre, txPrisma } from '../../../db/src/transacciones.ts';
import {
  baseLlamada,
  instalarRelojSimulado,
  urlDe,
  type BasePrueba,
} from '../../../db/test/ayudantes/base.ts';
import type { ClaimsSesion, SesionServidor } from '../../src/autenticacion/autorizar.ts';
import { sinParametros } from '../../src/contratos/consultas.ts';
import { consultar, type DepsConsulta } from '../../src/consultas/comun.ts';
import { detalleCategoria } from '../../src/consultas/detalle-categoria.ts';
import { detalleLpa } from '../../src/consultas/detalle-lpa.ts';
import { inicio } from '../../src/consultas/inicio.ts';
import { OP01 } from '../../src/operaciones/cuentas/index.ts';
import { OP07 } from '../../src/operaciones/categorias/index.ts';
import {
  confirmar,
  type DefinicionOperacion,
  type DepsMarco,
} from '../../src/operaciones/marco.ts';
import { OP14, OP17, OP18 } from '../../src/operaciones/presupuesto/index.ts';
import { OP20, OP21, OP23 } from '../../src/operaciones/transacciones/index.ts';
import type { Ejecutor } from '../../../dominio/escenarios/ejecutar';
import {
  type Escenario,
  type Observado,
  type Op,
  PERIODOS,
  type Paso,
  usd,
} from '../../../dominio/escenarios/tipos';

const USUARIO = 'usuario-unico';
const PLANTILLA = 'finn_plantilla';
const SESION: SesionServidor = {
  obtenerClaims: () => Promise.resolve({ sub: USUARIO, aal: 'aal2' } as ClaimsSesion),
  obtenerUsuario: () => Promise.resolve({ id: USUARIO }),
};

type Transacciones = ReturnType<typeof transaccionesSobre>;
export interface Estado {
  base: BasePrueba;
  cliente: Cliente;
  tx: Transacciones;
  memoria: Memoria; // la de esta base: la memoria sigue a la revisión de una sola base (04 §5.3)
  hoy: string;
  reloj: number; // operaciones aplicadas: da el minuto de registro (orden D2, DP-16)
  contador: number; // ids de filas nuevas
  esc: Escenario;
}
type Def = DefinicionOperacion<never, unknown, unknown>;

const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const pad = (n: number) => String(n).padStart(2, '0');
/** Centavos → texto de la frontera (`"12.30"`, `"-0.05"`). */
const texto = (c: number) =>
  `${c < 0 ? '-' : ''}${Math.floor(Math.abs(c) / 100)}.${pad(Math.abs(c) % 100)}`;
const dolares = (d: number) => texto(usd(d));

/** 'AAAA-MM-DDThh:mm' local (UTC−6, sin horario de verano) a instante UTC en ms. */
function instanteMs(local: string): number {
  const [dia = '', hm = ''] = local.split('T');
  const [h = 0, m = 0] = hm.split(':').map(Number);
  const [a = 0, mes = 1, d = 1] = dia.split('-').map(Number);
  return Date.UTC(a, mes - 1, d, h + 6, m);
}

async function comoAdmin(sql: string): Promise<void> {
  const admin = crearCliente(urlDe('postgres', 'admin'));
  try {
    await admin.$executeRawUnsafe(sql);
  } finally {
    await admin.$disconnect();
  }
}
/** CREATE DATABASE … TEMPLATE `molde`, marcada con `finn.reloj_simulado = on` (07 §5.2, paso 5). */
async function crearBaseDe(molde: string, instalarReloj: boolean): Promise<BasePrueba> {
  const nombre = `finn_e_${randomUUID().replaceAll('-', '')}`;
  await comoAdmin(`CREATE DATABASE ${nombre} TEMPLATE ${molde}`);
  const base = baseLlamada(nombre);
  await comoAdmin(`ALTER DATABASE ${nombre} SET finn.reloj_simulado = on`);
  if (instalarReloj) await instalarRelojSimulado(base);
  return base;
}
const abrir = (base: BasePrueba) => {
  const cliente = crearCliente(base.url);
  return { cliente, tx: transaccionesSobre(cliente) };
};
const nuevoEstado = (
  base: BasePrueba,
  esc: Escenario,
  hoy: string,
  reloj: number,
  contador: number,
): Estado => ({ base, ...abrir(base), memoria: new Memoria(), hoy, reloj, contador, esc });

// ── Lectura: la consulta ─────────────────────────────────────────────────────────────────────────────────────────
const opcionesDe = (hoy: string, desfaseMs = 0): OpcionesTx => ({ reloj: { hoy, desfaseMs } });
const depsConsulta = (s: Estado, hoy = s.hoy): DepsConsulta => ({
  memoria: s.memoria,
  sesion: SESION,
  usuarioPermitido: USUARIO,
  leer: s.tx.leer,
  opciones: () => opcionesDe(hoy),
  registrar: async (evento) => {
    await s.tx.escribirTecnico(async (tx) => {
      await registrarEvento(tx, evento);
    }, opcionesDe(hoy));
  },
});
/** La instantánea de la consulta (memoria o carga nueva, 04 §5.3) con la revisión que vio. */
const leerI = (s: Estado, hoy = s.hoy) =>
  consultar(
    depsConsulta(s, hoy),
    { nombre: 'escenarios', contrato: sinParametros, parametros: undefined },
    ({ i, encabezado }) => ({ i, revision: encabezado.revision }),
  );

const buscar = <T>(x: T | undefined, que: string): T => {
  if (x === undefined) throw new Error(`el dato nombra ${que} que no existe`);
  return x;
};
const cuentaId = (i: Instantanea, nombre: string) =>
  buscar(
    i.hechos.cuentas.find((k) => k.nombre === nombre),
    `una cuenta (${nombre})`,
  ).id;
/** Nombre con que 01 §8 llama a una categoría: la de pago de la tarjeta T es "Pago T". */
function nombresDeCategorias(i: Instantanea): Map<Uuid, string> {
  const cuentas = new Map(i.hechos.cuentas.map((k) => [k.id, k.nombre]));
  return new Map(
    i.hechos.categorias.map((x) => [
      x.id,
      x.tarjetaId ? `Pago ${cuentas.get(x.tarjetaId)}` : x.nombre,
    ]),
  );
}
const categoriaId = (i: Instantanea, nombre: string) => {
  for (const [k, v] of nombresDeCategorias(i)) if (v === nombre) return k;
  throw new Error(`el dato nombra una categoría que no existe: ${nombre}`);
};

// ── Escritura: la operación real ─────────────────────────────────────────────────────────────────────────────────
type Rechazo = { codigo: string };
/** Simulado = real + desfase: se mide el reloj real de la base y se pide el instante local de la convención (DP-16). */
async function desfaseHacia(s: Estado, hoy: string, local: string): Promise<number> {
  const ms = await s.tx.leer(async (t) => {
    const [r] = await txPrisma(t).$queryRaw<
      { ms: bigint }[]
    >`SELECT (extract(epoch FROM clock_timestamp()) * 1000)::bigint AS ms`;
    return Number(r?.ms);
  }, opcionesDe(hoy));
  return instanteMs(local) - ms;
}

/** La entrada (04 §3) de una operación del dato, con los ids de la base. */
async function entradaDe(s: Estado, op: Op, hoy: string): Promise<{ def: Def; entrada: object }> {
  const { i, revision } = await leerI(s, hoy);
  const nuevo = () => uuid(++s.contador);
  const fecha = (f?: string) => f ?? hoy;
  const activo = i.presupuesto.activo.inicio;
  const como = <E, R, S>(def: DefinicionOperacion<E, R, S>, entrada: object) => ({
    def: def as unknown as Def,
    entrada,
  });
  switch (op.op) {
    case 'OP-01': {
      if (op.ultimos4 !== undefined) throw new Error('OP-01 con institución: no está en el lote');
      const tipo = op.tipo ?? 'efectivo';
      const comun = { id: nuevo(), nombre: op.cuenta, fechaApertura: op.apertura ?? '2027-01-21' };
      const saldo = dolares(op.saldo ?? 0);
      if (tipo === 'efectivo' || tipo === 'inversion') return como(OP01, { ...comun, tipo, saldo });
      if (tipo === 'tarjeta')
        return como(OP01, {
          ...comun,
          tipo,
          saldo,
          limiteCredito: dolares(op.limite ?? 5000),
          diaCorte: op.diaCorte ?? 15,
          diaPago: op.diaPago ?? 5,
        });
      const p = buscar(op.prestamo, `datos de préstamo (${op.cuenta})`);
      return como(OP01, {
        ...comun,
        tipo,
        saldo,
        contraparte: p.contraparte,
        montoOriginal: dolares(p.montoOriginal),
        tipoTasa: 'fija',
        frecuencia: 'mensual',
        cuotaPactada: dolares(p.cuota),
        plazoCuotas: p.plazoCuotas,
        cuotasPagadasAlCrear: p.cuotasPagadas,
      });
    }
    case 'OP-07': {
      const grupo = buscar(
        i.hechos.grupos.find((g) => g.claveSistema === null),
        'el grupo Gastos',
      );
      return como(OP07, {
        tipo: 'categoria',
        id: nuevo(),
        nombre: op.categoria,
        grupoId: grupo.id,
      });
    }
    case 'OP-14': {
      const periodoInicio = op.desde ?? (op.periodo ? PERIODOS[op.periodo] : activo);
      const categoria = categoriaId(i, op.categoria);
      const actual =
        i.hechos.asignaciones.find(
          (a) => a.categoriaId === categoria && a.periodoInicio === periodoInicio,
        )?.monto ?? 0;
      return como(OP14, {
        categoriaId: categoria,
        periodoInicio,
        montoNuevo: texto(actual + usd(op.monto)),
        esperado: { monto: texto(actual) },
      });
    }
    case 'OP-17':
      return como(OP17, {
        periodoInicio: op.periodo ? PERIODOS[op.periodo] : activo,
        esperado: { revision },
      });
    case 'OP-18': {
      const categoria = categoriaId(i, op.categoria);
      if (op.editar) {
        const meta = buscar(
          i.hechos.metas.find((m) => m.categoriaId === categoria),
          `una meta (${op.categoria})`,
        );
        return como(OP18, {
          accion: 'editar',
          metaId: meta.id,
          ...(op.monto !== undefined && { monto: dolares(op.monto) }),
          ...(op.fecha && { fechaObjetivo: op.fecha }),
          esperado: {
            ...(op.monto !== undefined && { monto: texto(meta.monto) }),
            ...(op.fecha && { fechaObjetivo: meta.fechaObjetivo }),
          },
        });
      }
      const tipo = op.tipo ?? 'mensual';
      return como(OP18, {
        accion: 'crear',
        id: nuevo(),
        categoriaId: categoria,
        tipo,
        ...((tipo === 'mensual' || tipo === 'semanal') && { modo: op.modo ?? 'acumular' }),
        monto: dolares(op.monto ?? 0),
        ...(op.fecha && { fechaObjetivo: op.fecha }),
      });
    }
    case 'OP-20': {
      const lineas = op.lineas ?? [
        { monto: op.monto, ...(op.categoria && { categoria: op.categoria }) },
      ];
      return como(OP20, {
        id: nuevo(),
        fecha: fecha(op.fecha),
        total: dolares(op.monto),
        cuentaId: cuentaId(i, op.cuenta),
        lineas: lineas.map((l) => ({
          monto: dolares(l.monto),
          destino: l.deudor
            ? { deudorNuevo: l.deudor }
            : { categoriaId: categoriaId(i, l.categoria as string) },
        })),
      });
    }
    case 'OP-21':
      return como(OP21, {
        id: nuevo(),
        fecha: fecha(op.fecha),
        total: dolares(op.monto),
        cuentaId: cuentaId(i, op.cuenta ?? 'Ahorro'),
      });
    case 'OP-23':
      return como(OP23, {
        id: nuevo(),
        fecha: fecha(op.fecha),
        total: dolares(op.monto),
        origenId: cuentaId(i, op.origen ?? 'Ahorro'),
        tarjetaId: cuentaId(i, op.tarjeta),
      });
    default:
      throw new Error(`ejecutor int: ${op.op} no está en el lote de TA-188`);
  }
}

/** Aplica una operación con `confirmar`; los avisos "antes de confirmar" piden la huella y se confirma con ella. */
async function aplicarOp(s: Estado, op: Op, avisos: Set<string>): Promise<Rechazo | undefined> {
  const hoy = op.hoy ?? s.hoy;
  const minutos = 12 * 60 + ++s.reloj;
  const local = `${hoy}T${pad(Math.floor(minutos / 60))}:${pad(minutos % 60)}`;
  const desfaseMs = await desfaseHacia(s, hoy, local);
  const deps: DepsMarco = {
    memoria: s.memoria,
    escribir: s.tx.escribir,
    leer: s.tx.leer,
    escribirTecnico: s.tx.escribirTecnico,
    opciones: () => opcionesDe(hoy, desfaseMs),
  };
  const { def, entrada } = await entradaDe(s, op, hoy);
  let r = await confirmar(def, entrada, deps);
  if (!r.ok && r.error.codigo === 'requiere_confirmacion' && r.error.previsualizacion) {
    const v = r.error.previsualizacion;
    for (const a of v['avisos'] as readonly { codigo: string }[]) avisos.add(a.codigo);
    r = await confirmar(
      def,
      { ...entrada, revisionVista: v.revisionVista, huellaImpacto: v.huellaImpacto },
      deps,
    );
  }
  if (r.ok) {
    for (const a of r.avisos) avisos.add(a.codigo);
    return undefined;
  }
  if (r.error.categoria === 'DOMINIO' || r.error.categoria === 'NO_ENCONTRADO')
    return { codigo: r.error.codigo };
  throw new Error(`${op.op}: ${r.error.categoria} ${r.error.codigo} ${r.error.mensaje}`);
}

// ── Columnas fuera de la instantánea (regla 9): por las consultas reales ─────────────────────────────────────────
const ANTES = new Set(['desgloseAntes']);
type Extra = (s: Estado, i: Instantanea, arg: string) => Promise<number> | number;
const periodoDe = (p: string) => PERIODOS[p as keyof typeof PERIODOS];
const desglose: Extra = async (s, i, arg) => {
  const [tarjeta = '', campo = ''] = arg.split(':');
  const d = await detalleCategoria(depsConsulta(s), {
    categoriaId: categoriaId(i, `Pago ${tarjeta}`),
  });
  if (!('desgloseAlPagar' in d)) throw new Error(`desglose:${arg}: no es una categoría de pago`);
  return (d.desgloseAlPagar as unknown as Record<string, number>)[campo] as number;
};
const EXTRAS: Record<string, Extra> = {
  patrimonio: async (s) => (await inicio(depsConsulta(s))).patrimonio.neto,
  reduccionProyectada: async (s) =>
    (await detalleLpa(depsConsulta(s))).reduccionProyectadaAlCierre.total,
  desglose,
  desgloseAntes: desglose,
  lpaCierre: async (s, _i, p) => {
    const d = await detalleLpa(depsConsulta(s), { periodos: 60 });
    const x = d.historial.find((h) => h.periodo.inicio === periodoDe(p));
    if (!x) throw new Error(`lpaCierre:${p}: el período no está cerrado`);
    return x.lpaAlCierre;
  },
  arrastre: (_s, i, p) =>
    i.presupuesto.celdas
      .filter((x) => x.periodo.inicio === periodoDe(p))
      .reduce((a, x) => a + x.arrastre, 0),
  efAl: (_s, i, fecha) => {
    const efectivo = new Set(
      i.hechos.cuentas.filter((k) => k.tipo === 'efectivo').map((k) => k.id),
    );
    const hasta = new Set(i.hechos.transacciones.filter((t) => t.fecha <= fecha).map((t) => t.id));
    return i.hechos.efectos
      .filter((e) => efectivo.has(e.cuentaId) && hasta.has(e.transaccionId))
      .reduce((a, e) => a + e.monto, 0);
  },
};

async function observar(
  s: Estado,
  claves: string[],
  avisos: Set<string>,
  previas: Observado['extra'],
): Promise<{ obs: Observado; i: Instantanea }> {
  const { i } = await leerI(s);
  const nombres = nombresDeCategorias(i);
  const cuentas = new Map(i.hechos.cuentas.map((k) => [k.id, k.nombre]));
  const disp: Observado['disp'] = {};
  const activo = i.presupuesto.activo.inicio;
  for (const x of i.presupuesto.celdas)
    if (x.periodo.inicio === activo) disp[nombres.get(x.categoriaId) as string] = x.disponible;
  const tarjetas: Observado['tarjetas'] = {};
  for (const t of i.tarjetas)
    tarjetas[cuentas.get(t.tarjetaId) as string] = [t.deuda, t.sinRespaldo, t.reservaExcedente];
  for (const a of avisosDeEstado(i)) avisos.add(a.aviso);
  const extra: Observado['extra'] = { ...previas };
  for (const k of claves) {
    const [nombre = '', arg = ''] = k.split(/:(.*)/s);
    if (ANTES.has(nombre)) continue;
    const f = EXTRAS[nombre];
    if (f) extra[k] = await f(s, i, arg);
  }
  const ef = i.cuentas.filter((k) => k.tipo === 'efectivo').reduce((a, k) => a + k.saldo, 0);
  const [lpa, fut, sobta] = [i.lpa.total, i.lpa.asignadoFuturos, i.sobregiroConTarjeta];
  return { obs: { ef, lpa, disp, fut, sobta, tarjetas, avisos: [...avisos].sort(), extra }, i };
}

export const ejecutorInt: Ejecutor<Estado> = {
  nombre: 'int',
  async iniciar(e: Escenario, hoy: string) {
    const s = nuevoEstado(await crearBaseDe(PLANTILLA, true), e, hoy, 0, 0);
    // 01 §8.0: el ciclo 21 y el grupo de pagos vienen de los datos iniciales de 03 §9; el grupo "Gastos" se crea aquí
    const grupo = await confirmar(
      OP07 as unknown as Def,
      { tipo: 'grupo', id: uuid(1), nombre: 'Gastos' },
      {
        memoria: s.memoria,
        escribir: s.tx.escribir,
        leer: s.tx.leer,
        escribirTecnico: s.tx.escribirTecnico,
        opciones: () => opcionesDe(hoy),
      },
    );
    if (!grupo.ok)
      throw new Error(`${e.id}: no se pudo crear el grupo Gastos (${grupo.error.codigo})`);
    s.contador = 1;
    for (const op of e.estadoInicial ?? []) {
      const r = await aplicarOp(s, op, new Set());
      if (r) throw new Error(`${e.id}: el estado inicial se rechazó (${r.codigo})`);
    }
    return s;
  },
  async bifurcar(s: Estado) {
    await s.cliente.$disconnect(); // CREATE DATABASE … TEMPLATE exige que nadie esté conectado a la fuente
    const base = await crearBaseDe(s.base.nombre, false);
    Object.assign(s, abrir(s.base)); // la línea principal sigue: una conexión nueva a su base
    return nuevoEstado(base, s.esc, s.hoy, s.reloj, s.contador);
  },
  async paso(s: Estado, p: Paso) {
    if (p.hoy) s.hoy = p.hoy;
    const claves = Object.keys(p.espera.extra ?? {});
    const antes = await leerI(s);
    const previa = JSON.stringify(antes.i);
    const previas: Observado['extra'] = {};
    for (const k of claves) {
      const [nombre = '', arg = ''] = k.split(/:(.*)/s);
      const f = EXTRAS[nombre];
      if (ANTES.has(nombre) && f) previas[k] = await f(s, antes.i, arg);
    }
    const avisos = new Set<string>();
    let rechazo: string | undefined;
    for (const [n, op] of p.ops.entries()) {
      const r = await aplicarOp(s, op, avisos);
      if (!r) continue;
      if (n > 0)
        throw new Error(
          `paso ${p.n}: un rechazo tras operaciones ya confirmadas no se puede descartar entero`,
        );
      rechazo = r.codigo;
      break;
    }
    const { obs, i } = await observar(s, claves, avisos, previas);
    return rechazo === undefined ? obs : { ...obs, rechazo, intacto: JSON.stringify(i) === previa };
  },
  async terminar(s: Estado) {
    await s.cliente.$disconnect().catch(() => undefined);
    await comoAdmin(`DROP DATABASE IF EXISTS ${s.base.nombre} WITH (FORCE)`);
  },
};

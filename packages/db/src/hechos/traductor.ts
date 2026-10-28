// Traductor de cambios (04 §4.5, BE-15, BE-16; 04 §4.5.6, BE-32; 04 §2.4.1, BE-31): la lista de `Cambio` que
// devuelve `aplicar` se escribe en cuatro fases con un orden fijo de tablas, que no depende del orden en que el
// dominio los emitió. F1 desvincula (1→26), F2 elimina (26→1, con `eliminarConciliacionesDeCuenta` en el puesto
// de `conciliaciones`, HZ-1), F3 inserta (1→26, un `createManyAndReturn` por tabla) y F4 actualiza (1→26). Dentro
// de la tabla, F1, F2 y F4 van por `id`; F3, en el orden del dominio. Cada inserción y actualización de una tabla
// [M] devuelve con `RETURNING` lo que fija la base: `revision` y, en `transacciones` y `condonaciones`,
// `secuencia`. El traductor siempre envía el `id` y nunca `revision` ni `secuencia` (03 §13.4, DB-21).
import type {
  BigintTexto,
  Cambio,
  FilaHecho,
  TablaEscribible,
  TablaMotor,
  Uuid,
} from '@finn/dominio';
import { ahoraDb, COLUMNAS_AHORA, conAhora } from '../ahora.ts';
import { dateDeFechaLocal, dateDeInstante } from '../mapeo/fechas.ts';
import { revisionDeBigint } from '../mapeo/montos.ts';
import { txPrisma, type EscritorTx } from '../transacciones.ts';

/** 04 §4.5.1: cada tabla va después de las tablas a las que apuntan sus claves foráneas. */
export const ORDEN_TABLAS = [
  'vigencias_ciclo',
  'instituciones',
  'cuentas',
  'tarjetas',
  'prestamos',
  'inversiones',
  'grupos',
  'categorias',
  'metas',
  'deudores',
  'programadas',
  'programada_lineas',
  'conciliaciones',
  'transacciones',
  'efectos',
  'lineas',
  'condonaciones',
  'ocurrencias_resueltas',
  'cambios_posteriores',
  'asignaciones',
  'formatos_bancarios',
  'reglas_comercio',
  'sms_recibidos',
  'sms_procesamientos',
  'movimientos',
  'movimiento_lineas',
] as const satisfies readonly (TablaEscribible | 'sms_recibidos' | 'sms_procesamientos')[];
// `sms_recibidos` y `sms_procesamientos` son [I]: no las escribe el dominio (03 §0.4)
const ESCRIBIBLES = ORDEN_TABLAS.filter(
  (t): t is (typeof ORDEN_TABLAS)[number] & TablaEscribible =>
    t !== 'sms_recibidos' && t !== 'sms_procesamientos',
);

/** El modelo de Prisma de cada tabla escribible (03 §10.3). */
const MODELO: { readonly [T in TablaEscribible]: string } = {
  vigencias_ciclo: 'vigenciaCiclo',
  instituciones: 'institucion',
  cuentas: 'cuenta',
  tarjetas: 'tarjeta',
  prestamos: 'prestamo',
  inversiones: 'inversion',
  grupos: 'grupo',
  categorias: 'categoria',
  metas: 'meta',
  deudores: 'deudor',
  programadas: 'programada',
  programada_lineas: 'programadaLinea',
  conciliaciones: 'conciliacion',
  transacciones: 'transaccion',
  efectos: 'efecto',
  lineas: 'linea',
  condonaciones: 'condonacion',
  ocurrencias_resueltas: 'ocurrenciaResuelta',
  cambios_posteriores: 'cambioPosterior',
  asignaciones: 'asignacion',
  formatos_bancarios: 'formatoBancario',
  reglas_comercio: 'reglaComercio',
  movimientos: 'movimiento',
  movimiento_lineas: 'movimientoLinea',
};

const SUBTIPOS: ReadonlySet<string> = new Set(['tarjetas', 'prestamos', 'inversiones']);
const CON_SECUENCIA: ReadonlySet<string> = new Set(['transacciones', 'condonaciones']);
// Las 18 tablas [M] (las que carga el motor, 03 §0.4) tienen `revision`; las [H], no
const TABLAS_M: ReadonlySet<string> = new Set(
  Object.keys({
    vigencias_ciclo: true,
    cuentas: true,
    tarjetas: true,
    prestamos: true,
    inversiones: true,
    grupos: true,
    categorias: true,
    asignaciones: true,
    deudores: true,
    transacciones: true,
    efectos: true,
    lineas: true,
    condonaciones: true,
    metas: true,
    programadas: true,
    programada_lineas: true,
    ocurrencias_resueltas: true,
    conciliaciones: true,
  } satisfies Record<TablaMotor, true>),
);
// BE-16: `orden` de las líneas no cambia una vez escrito (UNIQUE (transaccion_id, orden) no es diferible)
const ORDEN_FIJO: ReadonlySet<string> = new Set(['lineas', 'movimiento_lineas']);
// Columnas `date` e instantes `timestamptz` de las tablas escribibles (03 §3), por nombre de campo
const FECHAS: ReadonlySet<string> = new Set([
  'rigeDesde',
  'fechaApertura',
  'periodoInicio',
  'fecha',
  'fechaObjetivo',
  'fechaCreacion',
  'primeraFecha',
  'fechaFin',
  'reactivadaDesde',
  'fechaEsperada',
  'fechaEstado',
  'esperadaFecha',
]);
const INSTANTES: ReadonlySet<string> = new Set([
  'horaRegistro',
  'claveOrden',
  'terminadaEn',
  'registradoEn',
]);
const FIJA_LA_BASE: ReadonlySet<string> = new Set(['revision', 'secuencia']);

/** Lo que fijó la base en una fila [M] insertada o actualizada (04 §4.5.6). */
export type ValorDeLaBase = {
  readonly tabla: TablaMotor;
  readonly id: Uuid;
  readonly revision: BigintTexto;
  readonly secuencia?: BigintTexto;
};
export type ValoresDeLaBase = readonly ValorDeLaBase[];

/** Un error del dominio o del llamador, no de la base: la aplicación lo trata como `INTERNO`. */
export class ErrorTraductor extends Error {
  override readonly name = 'ErrorTraductor';
}

type Datos = Record<string, unknown>;
interface Delegado {
  createManyAndReturn(a: { data: Datos[]; select: Datos }): Promise<Datos[]>;
  update(a: { where: Datos; data: Datos; select: Datos }): Promise<Datos>;
  delete(a: { where: Datos; select: Datos }): Promise<Datos>;
  findMany(a: { where: Datos; select: Datos }): Promise<Datos[]>;
}
type Insertar = Extract<Cambio, { tipo: 'insertar' }>;
type Actualizar = Extract<Cambio, { tipo: 'actualizar' }>;
type Eliminar = Extract<Cambio, { tipo: 'eliminar' }>;

/** La clave de la tabla: los subtipos usan `cuentaId` (03 §3.4–§3.6). */
const claveDe = (tabla: string): string => (SUBTIPOS.has(tabla) ? 'cuentaId' : 'id');
const porId = (a: { id: Uuid }, b: { id: Uuid }): number =>
  a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
const select = (tabla: string): Datos => ({
  [claveDe(tabla)]: true,
  ...(TABLAS_M.has(tabla) ? { revision: true } : {}),
  ...(CON_SECUENCIA.has(tabla) ? { secuencia: true } : {}),
});
// Claves foráneas: todo campo `…Id` que no es la clave de la tabla (03 §10.3)
const esFk = (tabla: string, campo: string): boolean =>
  campo !== claveDe(tabla) && /^[a-z][A-Za-z0-9]*Id$/.test(campo);

/** Campos del dominio → datos de Prisma: fechas e instantes a `Date`, sin `revision` ni `secuencia`. */
function datos(fila: Partial<FilaHecho>): Datos {
  const d: Datos = {};
  for (const [campo, v] of Object.entries(fila)) {
    if (FIJA_LA_BASE.has(campo) || v === undefined) continue;
    if (v === null) d[campo] = null;
    else if (FECHAS.has(campo))
      d[campo] = dateDeFechaLocal(v as Parameters<typeof dateDeFechaLocal>[0]);
    else if (INSTANTES.has(campo)) d[campo] = dateDeInstante(v as string);
    else d[campo] = Array.isArray(v) ? [...(v as unknown[])] : v;
  }
  return d;
}

/**
 * Escribe `cambios` en la transacción de `tx` en el orden de 04 §4.5 y devuelve, por cada fila [M] insertada
 * o actualizada, lo que fijó la base (BE-32). `finn.operacion` ya está fijada (paso 10 de 04 §4.2).
 */
export async function aplicarCambios(
  tx: EscritorTx,
  cambios: readonly Cambio[],
): Promise<ValoresDeLaBase> {
  const p = txPrisma(tx);
  const delegado = (tabla: TablaEscribible): Delegado =>
    (p as unknown as Record<string, Delegado>)[MODELO[tabla]] as Delegado;
  const insertar: Insertar[] = [];
  const actualizar: Actualizar[] = [];
  const eliminar: Eliminar[] = [];
  const cuentasSinConciliaciones: Uuid[] = [];
  for (const c of cambios) {
    if (c.tipo === 'insertar') insertar.push(c);
    else if (c.tipo === 'actualizar') actualizar.push(c);
    else if (c.tipo === 'eliminar') eliminar.push(c);
    else cuentasSinConciliaciones.push(c.cuentaId);
  }

  // Reglas de 04 §4.5.2 y BE-16, antes de enviar nada
  const nuevos = new Set<string>();
  for (const c of insertar) {
    const id = (c.fila as unknown as Datos)[claveDe(c.tabla)];
    if (typeof id !== 'string' || id === '')
      throw new ErrorTraductor(`insertar en ${c.tabla} sin ${claveDe(c.tabla)} (BE-31)`);
    nuevos.add(id);
  }
  for (const c of eliminar)
    if (c.tabla === 'conciliaciones' || c.tabla === 'cambios_posteriores')
      throw new ErrorTraductor(
        `eliminar en ${c.tabla}: solo con eliminarConciliacionesDeCuenta (HZ-1)`,
      );
  for (const c of actualizar)
    if (ORDEN_FIJO.has(c.tabla) && 'orden' in c.campos)
      throw new ErrorTraductor(
        `actualizar ${c.tabla}.orden de ${c.id}: el orden no cambia (BE-16)`,
      );

  // F1: las actualizaciones que cambian una clave foránea cuyo valor anterior es una fila que se elimina
  const eliminados = new Set<string>(eliminar.map((c) => c.id));
  const enF1 = new Set<Actualizar>();
  if (eliminados.size > 0) {
    for (const tabla of ESCRIBIBLES) {
      const deTabla = actualizar.filter((c) => c.tabla === tabla);
      const fks = [
        ...new Set(deTabla.flatMap((c) => Object.keys(c.campos).filter((k) => esFk(tabla, k)))),
      ];
      if (fks.length === 0) continue;
      const clave = claveDe(tabla);
      const anteriores = await delegado(tabla).findMany({
        where: { [clave]: { in: deTabla.map((c) => c.id) } },
        select: { [clave]: true, ...Object.fromEntries(fks.map((k) => [k, true])) },
      });
      const porClave = new Map(anteriores.map((f) => [f[clave], f]));
      for (const c of deTabla) {
        const antes = porClave.get(c.id);
        const campos = Object.keys(c.campos).filter((k) => esFk(tabla, k));
        if (!campos.some((k) => eliminados.has(String(antes?.[k])))) continue;
        for (const k of campos)
          if (nuevos.has(String((c.campos as Datos)[k])))
            throw new ErrorTraductor(
              `F1 en ${tabla} ${c.id}: ${k} apunta a una fila nueva (04 §4.5.2)`,
            );
        enF1.add(c);
      }
    }
  }

  const valores: ValorDeLaBase[] = [];
  const recoger = (tabla: TablaEscribible, f: Datos): void => {
    if (!TABLAS_M.has(tabla)) return;
    valores.push({
      tabla: tabla as TablaMotor,
      id: f[claveDe(tabla)] as Uuid,
      revision: revisionDeBigint(f['revision'] as bigint) as BigintTexto,
      ...(CON_SECUENCIA.has(tabla)
        ? { secuencia: revisionDeBigint(f['secuencia'] as bigint) as BigintTexto }
        : {}),
    });
  };
  const actualizarTabla = async (
    tabla: TablaEscribible,
    cs: readonly Actualizar[],
  ): Promise<void> => {
    for (const c of [...cs].sort(porId))
      recoger(
        tabla,
        await delegado(tabla).update({
          where: { [claveDe(tabla)]: c.id },
          data: datos(c.campos),
          select: select(tabla),
        }),
      );
  };

  for (const tabla of ESCRIBIBLES) {
    await actualizarTabla(
      tabla,
      actualizar.filter((c) => c.tabla === tabla && enF1.has(c)),
    );
  }
  // F2: de hijos a padres; las filas en cascada las quita la base (DB-12)
  for (const tabla of [...ESCRIBIBLES].reverse()) {
    if (tabla === 'conciliaciones')
      for (const cuentaId of [...cuentasSinConciliaciones].sort())
        await p.$queryRaw`SELECT finn.eliminar_conciliaciones_de_cuenta(${cuentaId}::uuid)::text AS n`;
    for (const c of eliminar.filter((x) => x.tabla === tabla).sort(porId))
      await delegado(tabla).delete({
        where: { [claveDe(tabla)]: c.id },
        select: { [claveDe(tabla)]: true },
      });
  }
  // F3: padres antes que hijos; una sola sentencia por tabla, con RETURNING
  for (const tabla of ESCRIBIBLES) {
    const filas = insertar.filter((c) => c.tabla === tabla).map((c) => datos(c.fila));
    if (filas.length === 0) continue;
    const modelo = MODELO[tabla];
    const ahora = Object.hasOwn(COLUMNAS_AHORA, modelo) ? await ahoraDb(tx) : null;
    const devueltas = await delegado(tabla).createManyAndReturn({
      data: filas.map((f) => (ahora ? conAhora(modelo, f, ahora) : f)),
      select: select(tabla),
    });
    if (devueltas.length !== filas.length)
      throw new ErrorTraductor(
        `${tabla}: ${filas.length} filas insertadas, ${devueltas.length} devueltas`,
      );
    for (const f of devueltas) recoger(tabla, f);
  }
  // F4: el resto de las actualizaciones; pueden apuntar a filas de F3
  for (const tabla of ESCRIBIBLES) {
    await actualizarTabla(
      tabla,
      actualizar.filter((c) => c.tabla === tabla && !enF1.has(c)),
    );
  }
  return valores;
}

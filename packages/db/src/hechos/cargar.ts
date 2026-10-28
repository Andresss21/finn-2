// Carga de hechos (04 §5.2, BE-21; 03 §1.1): las 18 tablas [M] de 03 §0.4 en `Hechos`. Una consulta `$queryRaw`
// por tabla, que devuelve todas sus filas como un único arreglo JSON de arreglos con las columnas en el orden
// de `ESPECIFICACION` (V-13: un solo valor de texto por tabla es lo más rápido). No ordena: el motor no depende
// del orden de entrada (inv. 26). Fechas: `date` ya sale como 'AAAA-MM-DD' (una `FechaLocal`, sin `Date`);
// instantes: ISO UTC con milisegundos (04 §13.1); montos: números JSON; `bigint` (secuencia, revisión): texto.
import { Centavos, FechaLocal } from '@finn/dominio/valores';
import type { BigintTexto, FilasPorTabla, Hechos, Instante, TablaMotor } from '@finn/dominio';
import { Prisma } from '../generado/prisma/client.ts';
import { txPrisma, type LectorTx } from '../transacciones.ts';

/** Tipo de cada columna: define el SQL que la serializa y la conversión a tipos del dominio. */
type Clase =
  | 'texto' // text, enums, uuid
  | 'entero' // integer, smallint
  | 'logico' // boolean
  | 'centavos' // integer en centavos
  | 'fecha' // date
  | 'instante' // timestamptz
  | 'bigint'; // bigint, como texto

type Col<T extends TablaMotor> = readonly [campo: keyof FilasPorTabla[T] & string, clase: Clase];
type Especificacion = { readonly [T in TablaMotor]: readonly Col<T>[] };

const REV = ['revision', 'bigint'] as const;

/**
 * Columnas que usa el motor por tabla, con el nombre del campo del modelo (03 §10.3); la columna SQL es el mismo
 * nombre en snake_case. Fuera de aquí quedan `transacciones.monto_original` (informativo, 03 §3.12) y
 * `programadas.reactivada_desde` (`COLUMNAS_NO_CARGADAS`).
 */
const ESPECIFICACION: Especificacion = {
  vigencias_ciclo: [['id', 'texto'], ['diaInicio', 'entero'], ['rigeDesde', 'fecha'], REV],
  cuentas: [
    ['id', 'texto'],
    ['tipo', 'texto'],
    ['nombre', 'texto'],
    ['institucionId', 'texto'],
    ['ultimos4', 'texto'],
    ['fechaApertura', 'fecha'],
    ['orden', 'entero'],
    ['archivada', 'logico'],
    REV,
  ],
  tarjetas: [
    ['cuentaId', 'texto'],
    ['tipo', 'texto'],
    ['limiteCredito', 'centavos'],
    ['tasaAnualMillonesimas', 'entero'],
    ['diaCorte', 'entero'],
    ['diaPago', 'entero'],
    ['red', 'texto'],
    ['color', 'texto'],
    REV,
  ],
  prestamos: [
    ['cuentaId', 'texto'],
    ['tipo', 'texto'],
    ['contraparte', 'texto'],
    ['montoOriginal', 'centavos'],
    ['tasaNominalAnualMillonesimas', 'entero'],
    ['tipoTasa', 'texto'],
    ['seguroPrimerMes', 'centavos'],
    ['comision', 'centavos'],
    ['frecuencia', 'texto'],
    ['frecuenciaDias', 'entero'],
    ['cuotaPactada', 'centavos'],
    ['plazoCuotas', 'entero'],
    ['modeloCalculo', 'texto'],
    ['cuotasPagadasAlCrear', 'entero'],
    REV,
  ],
  inversiones: [
    ['cuentaId', 'texto'],
    ['tipo', 'texto'],
    ['rendimientoAnualEsperadoMillonesimas', 'entero'],
    REV,
  ],
  grupos: [
    ['id', 'texto'],
    ['nombre', 'texto'],
    ['orden', 'entero'],
    ['archivado', 'logico'],
    ['claveSistema', 'texto'],
    REV,
  ],
  categorias: [
    ['id', 'texto'],
    ['grupoId', 'texto'],
    ['nombre', 'texto'],
    ['orden', 'entero'],
    ['clase', 'texto'],
    ['tarjetaId', 'texto'],
    ['archivada', 'logico'],
    REV,
  ],
  asignaciones: [
    ['id', 'texto'],
    ['categoriaId', 'texto'],
    ['periodoInicio', 'fecha'],
    ['monto', 'centavos'],
    REV,
  ],
  deudores: [['id', 'texto'], ['nombre', 'texto'], REV],
  transacciones: [
    ['id', 'texto'],
    ['tipo', 'texto'],
    ['fecha', 'fecha'],
    ['horaRegistro', 'instante'],
    ['claveOrden', 'instante'],
    ['secuencia', 'bigint'],
    ['origen', 'texto'],
    ['estadoBancario', 'texto'],
    ['conciliacionId', 'texto'],
    ['comercio', 'texto'],
    ['nota', 'texto'],
    ['total', 'centavos'],
    ['monedaOriginal', 'texto'],
    ['lineaCobradaId', 'texto'],
    REV,
  ],
  efectos: [
    ['id', 'texto'],
    ['transaccionId', 'texto'],
    ['cuentaId', 'texto'],
    ['monto', 'centavos'],
    ['interes', 'centavos'],
    ['seguro', 'centavos'],
    REV,
  ],
  lineas: [
    ['id', 'texto'],
    ['transaccionId', 'texto'],
    ['orden', 'entero'],
    ['monto', 'centavos'],
    ['categoriaId', 'texto'],
    ['deudorId', 'texto'],
    ['lineaOriginalId', 'texto'],
    REV,
  ],
  condonaciones: [
    ['id', 'texto'],
    ['lineaId', 'texto'],
    ['fecha', 'fecha'],
    ['monto', 'centavos'],
    ['claveOrden', 'instante'],
    ['secuencia', 'bigint'],
    ['categoriaId', 'texto'],
    REV,
  ],
  metas: [
    ['id', 'texto'],
    ['categoriaId', 'texto'],
    ['tipo', 'texto'],
    ['modo', 'texto'],
    ['monto', 'centavos'],
    ['fechaObjetivo', 'fecha'],
    ['fechaCreacion', 'fecha'],
    REV,
  ],
  programadas: [
    ['id', 'texto'],
    ['tipo', 'texto'],
    ['cuentaId', 'texto'],
    ['cuentaDestinoId', 'texto'],
    ['comercio', 'texto'],
    ['monto', 'centavos'],
    ['tolerancia', 'centavos'],
    ['frecuencia', 'texto'],
    ['frecuenciaDias', 'entero'],
    ['primeraFecha', 'fecha'],
    ['fechaFin', 'fecha'],
    ['registroAutomatico', 'logico'],
    ['activa', 'logico'],
    REV,
  ],
  programada_lineas: [
    ['id', 'texto'],
    ['programadaId', 'texto'],
    ['orden', 'entero'],
    ['monto', 'centavos'],
    ['categoriaId', 'texto'],
    REV,
  ],
  ocurrencias_resueltas: [
    ['id', 'texto'],
    ['programadaId', 'texto'],
    ['fechaEsperada', 'fecha'],
    ['estado', 'texto'],
    ['transaccionId', 'texto'],
    REV,
  ],
  conciliaciones: [
    ['id', 'texto'],
    ['cuentaId', 'texto'],
    ['fechaEstado', 'fecha'],
    ['saldoEstado', 'centavos'],
    ['terminadaEn', 'instante'],
    ['diferenciaAceptada', 'centavos'],
    ['modo', 'texto'],
    REV,
  ],
};

/** Columnas de una tabla [M] que `cargarHechos` no lee a propósito (04 §5.2; 03 §3.12). */
export const COLUMNAS_NO_CARGADAS: Readonly<Partial<Record<TablaMotor, readonly string[]>>> = {
  transacciones: ['monto_original'],
  programadas: ['reactivada_desde'],
};

const snake = (campo: string): string => campo.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);

/** Los nombres de columna SQL que lee cada tabla, en el orden de su consulta. */
export const COLUMNAS_CARGADAS: Readonly<Record<TablaMotor, readonly string[]>> =
  Object.fromEntries(
    Object.entries(ESPECIFICACION).map(([t, cols]) => [t, cols.map(([campo]) => snake(campo))]),
  ) as Record<TablaMotor, string[]>;

const ISO_UTC = `'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'`;

function expresion([campo, clase]: readonly [string, Clase]): string {
  const col = snake(campo);
  if (clase === 'instante') return `to_char(${col} AT TIME ZONE 'UTC', ${ISO_UTC})`;
  if (clase === 'bigint') return `${col}::text`;
  return col;
}

/** El SQL de una tabla: un solo arreglo JSON de arreglos, como texto (04 §5.2). */
export function consultaDe(tabla: TablaMotor): string {
  const exprs = (ESPECIFICACION[tabla] as readonly (readonly [string, Clase])[]).map(expresion);
  return `SELECT coalesce(json_agg(json_build_array(${exprs.join(', ')})), '[]')::text AS filas FROM finn.${tabla}`;
}

const INSTANTE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const ENTERO_SIN_SIGNO = /^\d{1,19}$/;

function convertir(clase: Clase, v: unknown, ubicacion: string): unknown {
  if (v === null) return null;
  const mal = (): never => {
    throw new TypeError(`${ubicacion}: valor inesperado ${JSON.stringify(v)} para ${clase}`);
  };
  switch (clase) {
    case 'texto':
      return typeof v === 'string' ? v : mal();
    case 'entero':
      return typeof v === 'number' && Number.isSafeInteger(v) ? v : mal();
    case 'logico':
      return typeof v === 'boolean' ? v : mal();
    case 'centavos':
      return typeof v === 'number' ? Centavos.desdeEntero(v) : mal();
    case 'fecha':
      return typeof v === 'string' ? FechaLocal.desdeTexto(v) : mal();
    case 'instante':
      return typeof v === 'string' && INSTANTE.test(v) ? (v as Instante) : mal();
    case 'bigint':
      return typeof v === 'string' && ENTERO_SIN_SIGNO.test(v) ? (v as BigintTexto) : mal();
  }
}

function filasDe<T extends TablaMotor>(tabla: T, json: string): FilasPorTabla[T][] {
  const cols = ESPECIFICACION[tabla] as readonly (readonly [string, Clase])[];
  const arreglos = JSON.parse(json) as unknown[][];
  return arreglos.map((fila) => {
    const obj: Record<string, unknown> = {};
    cols.forEach(([campo, clase], i) => {
      obj[campo] = convertir(clase, fila[i], `${tabla}.${campo}`);
    });
    // `monto_original` no se carga (informativo, 03 §3.12): el motor nunca lo lee
    if (tabla === 'transacciones') obj['montoOriginal'] = null;
    return obj as unknown as FilasPorTabla[T];
  });
}

/**
 * Las 18 tablas [M] de la instantánea de `tx` (la de `leer()`, 04 §5.1): una consulta por tabla. Los `Uuid`,
 * `Instante` y `BigintTexto` son los textos de la base; los montos pasan por `Centavos.desdeEntero`.
 */
export async function cargarHechos(tx: LectorTx): Promise<Hechos> {
  const prisma = txPrisma(tx);
  const hechos: Partial<Record<TablaMotor, unknown>> = {};
  for (const tabla of Object.keys(ESPECIFICACION) as TablaMotor[]) {
    const [r] = await prisma.$queryRaw<{ filas: string }[]>(Prisma.raw(consultaDe(tabla)));
    if (!r) throw new Error(`La consulta de ${tabla} no devolvió fila`);
    hechos[tabla] = filasDe(tabla, r.filas);
  }
  return hechos as Hechos;
}

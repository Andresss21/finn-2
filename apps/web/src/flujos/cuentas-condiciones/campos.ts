// Campos de `/cuentas/[cuentaId]/condiciones` (FT-55): el contrato del formulario y la entrada de OP-48. Los valores del
// formulario son texto (05 §4.2). `esperado` es lo que vio la persona, con el tipo de `op48` (montos y porcentajes en texto,
// `null` si no había valor, 4.6.2). La interfaz no calcula montos (PF-3): solo pasa de un formato a otro.
import * as z from 'zod';
import type { Centavos } from '@finn/dominio/valores';
import { centavosATextoDecimal } from '../../formato/monto';
import { normalizarMontoEscrito } from '../../formularios/normalizar-monto';
import { cuentasCondiciones as t } from '../../textos/cuentas-condiciones';

export const SIN_MODELO = 'ninguno';
const n = t.comunes;

export type Clase = 'monto' | 'entero' | 'porcentaje' | 'texto' | 'opciones';
export interface Descriptor {
  readonly n: Clave;
  readonly etiqueta: string;
  readonly clase: Clase;
  /** Con valor en la base no se puede dejar vacío: `op48` no acepta `null` (04 §3.9). */
  readonly requerido: boolean;
  readonly opciones?: Readonly<Record<string, string>>;
  /** Solo se muestra con este valor de otro campo (los días de "cada N días"). */
  readonly cuando?: readonly [Clave, string];
}

export const CLAVES = [
  'contraparte',
  'montoOriginal',
  'tasaNominalAnual',
  'seguroPrimerMes',
  'comision',
  'tipoTasa',
  'frecuencia',
  'frecuenciaDias',
  'cuotaPactada',
  'plazoCuotas',
  'modeloCalculo',
] as const;
export type Clave = (typeof CLAVES)[number];
export type Campos = Record<Clave, string>;

const d = (
  clave: Clave,
  etiqueta: string,
  clase: Clase,
  requerido: boolean,
  extra: Pick<Descriptor, 'opciones' | 'cuando'> = {},
): Descriptor => ({ n: clave, etiqueta, clase, requerido, ...extra });

export const DESCRIPTORES: readonly Descriptor[] = [
  d('contraparte', n.contraparte, 'texto', true),
  d('montoOriginal', n.montoOriginal, 'monto', true),
  d('tasaNominalAnual', n.tasaAnual, 'porcentaje', false),
  d('seguroPrimerMes', t.seguroPrimerMes, 'monto', false),
  d('comision', t.comision, 'monto', false),
  d('tipoTasa', n.tipoTasa, 'opciones', true, { opciones: n.tiposTasa }),
  d('frecuencia', n.frecuencia, 'opciones', true, { opciones: n.frecuencias }),
  d('frecuenciaDias', n.frecuenciaDias, 'entero', true, { cuando: ['frecuencia', 'cada_n_dias'] }),
  d('cuotaPactada', n.cuotaPactada, 'monto', true),
  d('plazoCuotas', n.plazoCuotas, 'entero', true),
  d('modeloCalculo', n.modelo, 'opciones', false, { opciones: n.modelos }),
];

export const visible = (x: Descriptor, c: Campos): boolean =>
  x.cuando === undefined || c[x.cuando[0]] === x.cuando[1];

const monto = (texto: string): string => {
  const r = normalizarMontoEscrito(texto);
  if (r.estado !== 'valido') return texto.trim();
  const [entera = '0', decimales = ''] = r.texto.split('.');
  return `${entera}.${decimales.padEnd(2, '0')}`; // «350» y «350.00» son lo mismo: no es un cambio
};

/** Lo escrito de un campo, con el tipo de `op48`; `null` si está vacío (o es «Sin modelo»). */
export function valorDe(clase: Clase, texto: string): string | number | null {
  const v = texto.trim();
  if (v === '' || v === SIN_MODELO) return null;
  if (clase === 'monto') return monto(v);
  if (clase === 'entero') return Number(v);
  return clase === 'porcentaje' ? v.replace(',', '.') : v;
}

/** `120000` millonésimas → `"12"`; `127525` → `"12.7525"` (DB-13). */
const porcentajeDe = (millonesimas: number): string => {
  const decimales = String(millonesimas % 10_000)
    .padStart(4, '0')
    .replace(/0+$/, '');
  const entero = String(Math.trunc(millonesimas / 10_000));
  return decimales === '' ? entero : `${entero}.${decimales}`;
};

/**
 * Los datos del préstamo como vienen del servidor (la fila de `prestamos` o los `actuales` de un conflicto) → los textos del
 * formulario. Los montos llegan en centavos y la tasa en millonésimas, con el nombre del dominio o el del contrato.
 */
export function camposDe(crudo: Readonly<Record<string, unknown>>): Campos {
  const salida = {} as Campos;
  for (const x of DESCRIPTORES) {
    const v =
      crudo[x.n] ?? (x.n === 'tasaNominalAnual' ? crudo['tasaNominalAnualMillonesimas'] : null);
    salida[x.n] =
      v === null || v === undefined
        ? x.clase === 'opciones' && x.n === 'modeloCalculo'
          ? SIN_MODELO
          : ''
        : x.clase === 'monto'
          ? centavosATextoDecimal(v as Centavos)
          : x.clase === 'porcentaje'
            ? porcentajeDe(v as number)
            : `${v as string | number}`;
  }
  return salida;
}

/** De los `actuales` de un conflicto (solo los campos que se enviaron), esos mismos como texto de formulario. */
export function actualesDe(crudo: Readonly<Record<string, unknown>>): Partial<Campos> {
  const todos = camposDe(crudo);
  return Object.fromEntries(
    DESCRIPTORES.filter(
      (x) =>
        x.n in crudo || (x.n === 'tasaNominalAnual' && 'tasaNominalAnualMillonesimas' in crudo),
    ).map((x) => [x.n, todos[x.n]]),
  );
}

/** Lo obligatorio escrito, los montos válidos y, de lo que ya tenía valor, nada vacío (`op48` no acepta `null`). */
export const contratoDe = (visto: Campos) =>
  z
    .object(Object.fromEntries(CLAVES.map((k) => [k, z.string()])) as Record<Clave, z.ZodString>)
    .superRefine((c, ctx) => {
      for (const x of DESCRIPTORES) {
        if (!visible(x, c)) continue;
        const vacio = valorDe(x.clase, c[x.n]) === null;
        const roto =
          x.clase === 'monto' && !vacio && normalizarMontoEscrito(c[x.n]).estado !== 'valido';
        const quitado = vacio && valorDe(x.clase, visto[x.n]) !== null;
        if ((x.requerido && vacio) || roto)
          ctx.addIssue({ code: 'custom', path: [x.n], message: n.obligatorio });
        else if (quitado) ctx.addIssue({ code: 'custom', path: [x.n], message: t.noSeQuita });
      }
    });

type Valores = Partial<Record<Clave, string | number | null>>;

/** Los campos que cambiaron respecto de lo que vio la persona, ya con el tipo de `op48`. */
export function cambiosDe(visto: Campos, c: Campos): Valores {
  const cambios: Valores = {};
  for (const x of DESCRIPTORES) {
    const nuevo = visible(x, c) ? valorDe(x.clase, c[x.n]) : null;
    if (nuevo !== null && nuevo !== valorDe(x.clase, visto[x.n])) cambios[x.n] = nuevo;
  }
  return cambios;
}

/** `esperado` de `op48`: de cada campo, lo que vio la persona (`null` si no había valor). */
export const esperadoDe = (visto: Campos): Valores =>
  Object.fromEntries(DESCRIPTORES.map((x) => [x.n, valorDe(x.clase, visto[x.n])]));

/** `useOperacion` entrega los campos más `modo`, `esperado` y la confirmación: la entrada de OP-48 sale de ellos. */
export function aEntradaDeAccion(
  prestamoId: string,
  visto: Campos,
  payload: unknown,
): Record<string, unknown> {
  const { modo, esperado, revisionVista, huellaImpacto, ...resto } = payload as Record<
    string,
    unknown
  >;
  const cambios = cambiosDe(visto, resto as Campos);
  return {
    prestamoId,
    ...cambios,
    esperado: esperado ?? esperadoDe(visto),
    modo,
    ...(revisionVista === undefined ? {} : { revisionVista, huellaImpacto }),
  };
}

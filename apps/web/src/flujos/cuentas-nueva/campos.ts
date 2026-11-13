// Los campos de `/cuentas/nueva` (FT-50) por tipo de cuenta, el contrato del formulario y la entrada de OP-01. Los valores del
// formulario son texto, como los escribe la persona (05 §4.2); el contrato completo lo aplica el servidor (`op01`).
import * as z from 'zod';
import { COLOR_ORO } from '../../componentes/dominio/colores-tarjeta';
import { aplicarSigno, normalizarMontoEscrito } from '../../formularios/normalizar-monto';
import { cuentasNuevaBase as t } from '../../textos/cuentas-nueva-base';

/** Valor de una selección opcional sin elegir: no se envía. */
const SIN_ELEGIR = 'ninguno';
export const TIPOS = ['efectivo', 'tarjeta', 'prestamo', 'inversion'] as const;
export type TipoCuenta = (typeof TIPOS)[number];

const CLAVES = [
  'nombre',
  'subtipoEfectivo',
  'institucionId',
  'ultimos4',
  'fechaApertura',
  'saldo',
  'limiteCredito',
  'tasaAnual',
  'diaCorte',
  'diaPago',
  'red',
  'color',
  'contraparte',
  'montoOriginal',
  'tasaNominalAnual',
  'tipoTasa',
  'frecuencia',
  'frecuenciaDias',
  'cuotaPactada',
  'plazoCuotas',
  'cuotasPagadasAlCrear',
  'modeloCalculo',
  'seguroPrimerMes',
  'comision',
  'rendimientoAnualEsperado',
] as const;
export type Clave = (typeof CLAVES)[number];

const textos = Object.fromEntries(CLAVES.map((k) => [k, z.string()])) as Record<Clave, z.ZodString>;

export type Clase = 'monto' | 'entero' | 'porcentaje' | 'texto' | 'opciones';
export interface Descriptor {
  readonly n: Clave;
  readonly clase: Clase;
  readonly requerido: boolean;
  /** Solo se muestra con este valor de otro campo (los días de "cada N días"). */
  readonly cuando?: readonly [Clave, string];
}

const d = (
  n: Clave,
  clase: Clase,
  requerido: boolean,
  cuando?: readonly [Clave, string],
): Descriptor => (cuando === undefined ? { n, clase, requerido } : { n, clase, requerido, cuando });

// Las etiquetas y las opciones de cada campo las pone `campos-de-tipo.tsx`, el módulo diferido que los dibuja.
export const CAMPOS_DE_TIPO: Readonly<Record<TipoCuenta, readonly Descriptor[]>> = {
  efectivo: [],
  tarjeta: [
    d('limiteCredito', 'monto', true),
    d('tasaAnual', 'porcentaje', false),
    d('diaCorte', 'entero', true),
    d('diaPago', 'entero', true),
    d('red', 'opciones', true),
    // El color lo dibuja el selector `color-tarjeta.tsx`, con sus 8 colores (CH-225).
    d('color', 'opciones', false),
  ],
  prestamo: [
    d('contraparte', 'texto', true),
    d('montoOriginal', 'monto', true),
    d('tasaNominalAnual', 'porcentaje', false),
    d('tipoTasa', 'opciones', true),
    d('frecuencia', 'opciones', true),
    d('frecuenciaDias', 'entero', true, ['frecuencia', 'cada_n_dias']),
    d('cuotaPactada', 'monto', true),
    d('plazoCuotas', 'entero', true),
    d('cuotasPagadasAlCrear', 'entero', true),
    d('modeloCalculo', 'opciones', false),
    // [CH-261] Con Banco Agrícola, las condiciones que el modelo usa, como en Editar condiciones (OP-01 ya las acepta)
    d('seguroPrimerMes', 'monto', false, ['modeloCalculo', 'banco_agricola']),
    d('comision', 'monto', false, ['modeloCalculo', 'banco_agricola']),
  ],
  inversion: [d('rendimientoAnualEsperado', 'porcentaje', false)],
};

/** [CH-224] Una billetera no lleva institución ni últimos 4 (03 §3.4): el formulario no los muestra ni los envía. */
export const conBanco = (c: Pick<Campos, 'tipo' | 'subtipoEfectivo'>): boolean =>
  c.tipo !== 'efectivo' || c.subtipoEfectivo !== 'billetera';

/**
 * El nombre que se propone (D1): en efectivo, el del subtipo; en los otros tipos, ninguno. Solo reemplaza un nombre vacío o
 * uno que también era una propuesta: lo que la persona escribió no se toca.
 */
export function nombrePropuesto(
  nombres: Readonly<Record<string, string>>,
  actual: string,
  tipo: TipoCuenta,
  subtipo: string,
): string | undefined {
  if (actual.trim() !== '' && !Object.values(nombres).includes(actual.trim())) return undefined;
  const nuevo = tipo === 'efectivo' ? (nombres[subtipo] ?? '') : '';
  return nuevo === actual ? undefined : nuevo;
}

export const visible = (x: Descriptor, c: Readonly<Record<Clave, string>>): boolean =>
  x.cuando === undefined || c[x.cuando[0]] === x.cuando[1];

export const CONTRATO = z
  .object({ tipo: z.enum(TIPOS), signo: z.enum(['positivo', 'negativo']), ...textos })
  .superRefine((c, ctx) => {
    const obligatorios: Descriptor[] = [
      d('nombre', 'texto', true),
      d('saldo', 'monto', true),
      ...CAMPOS_DE_TIPO[c.tipo].filter((x) => visible(x, c)),
    ];
    for (const { n, clase, requerido } of obligatorios) {
      const vacio = c[n].trim() === '';
      const roto = clase === 'monto' && !vacio && normalizarMontoEscrito(c[n]).estado !== 'valido';
      if ((requerido && vacio) || roto)
        ctx.addIssue({ code: 'custom', path: [n], message: t.obligatorio });
    }
  });
export type Campos = z.infer<typeof CONTRATO>;

const monto = (texto: string): string => {
  const r = normalizarMontoEscrito(texto);
  return r.estado === 'valido' ? r.texto : texto;
};

/** Lo escrito → la entrada de OP-01 (sin `id` ni `modo`, que agrega `useOperacion`). Lo vacío se omite. */
export function entradaDeOp01(c: Campos): Record<string, unknown> {
  const salida: Record<string, unknown> = {
    tipo: c.tipo,
    nombre: c.nombre.trim(),
    fechaApertura: c.fechaApertura,
    saldo: aplicarSigno(monto(c.saldo), c.tipo === 'tarjeta' ? c.signo : 'positivo'),
  };
  // [CH-224] [CH-229] en efectivo el subtipo va siempre; una billetera no envía institución ni últimos 4
  if (c.tipo === 'efectivo') salida['subtipoEfectivo'] = c.subtipoEfectivo;
  if (conBanco(c) && c.institucionId !== 'ninguna') salida['institucionId'] = c.institucionId;
  if (conBanco(c) && c.ultimos4.trim() !== '') salida['ultimos4'] = c.ultimos4.trim();
  for (const x of CAMPOS_DE_TIPO[c.tipo]) {
    const v = c[x.n].trim();
    if (v === '' || v === SIN_ELEGIR || !visible(x, c)) continue;
    salida[x.n] =
      x.clase === 'monto'
        ? monto(v)
        : x.clase === 'entero'
          ? Number(v)
          : x.clase === 'porcentaje'
            ? v.replace(',', '.')
            : v;
  }
  return salida;
}

/**
 * El aviso previo al envío de una tarjeta cuyo nombre ya usa otra, archivada o no (BE-35, `nombresTarjetaUsados`): el nombre
 * de la tarjeta es el de su categoría de pago y no distingue mayúsculas. No impide enviar: el servidor es quien rechaza.
 */
export function avisoDeNombreRepetido(
  tipo: TipoCuenta,
  nombre: string,
  usados: readonly { readonly nombre: string; readonly archivada: boolean }[],
): string | undefined {
  const clave = (n: string): string => n.trim().toLowerCase();
  if (tipo !== 'tarjeta' || nombre.trim() === '') return undefined;
  const usada = usados.find((u) => clave(u.nombre) === clave(nombre));
  if (usada === undefined) return undefined;
  return (usada.archivada ? t.nombreArchivada : t.nombreEnUso)(usada.nombre);
}

/** Los valores con que abre el formulario: la apertura es el `hoy` del servidor, nunca la fecha del dispositivo (05 §5.5). */
export const valoresIniciales = (hoy: string, tipo: TipoCuenta, nombre = ''): Campos => ({
  ...(Object.fromEntries(CLAVES.map((k) => [k, ''])) as Record<Clave, string>),
  tipo,
  signo: 'positivo',
  subtipoEfectivo: 'corriente',
  nombre,
  institucionId: 'ninguna',
  fechaApertura: hoy,
  red: 'otra',
  color: COLOR_ORO, // el selector de CH-225 empieza en oro
  modeloCalculo: SIN_ELEGIR,
  tipoTasa: 'fija',
  frecuencia: 'mensual',
});

/** `useOperacion` entrega los campos del formulario más `modo`, `id` y la confirmación: la entrada de OP-01 sale de ellos. */
export function aEntradaDeAccion(payload: unknown): Record<string, unknown> {
  const { modo, id, revisionVista, huellaImpacto, ...campos } = payload as Record<string, unknown>;
  return {
    ...entradaDeOp01(campos as Campos),
    modo,
    id,
    ...(revisionVista === undefined ? {} : { revisionVista, huellaImpacto }),
  };
}

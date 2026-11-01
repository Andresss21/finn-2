// Los campos de `/cuentas/nueva` (FT-50) por tipo de cuenta, el contrato del formulario y la entrada de OP-01. Los valores del
// formulario son texto, como los escribe la persona (05 §4.2); el contrato completo lo aplica el servidor (`op01`).
import * as z from 'zod';
import { aplicarSigno, normalizarMontoEscrito } from '../../formularios/normalizar-monto';
import { cuentasNueva as t } from '../../textos/cuentas-nueva';

/** Valor de una selección opcional sin elegir: no se envía. */
const SIN_ELEGIR = 'ninguno';
export const TIPOS = ['efectivo', 'tarjeta', 'prestamo', 'inversion'] as const;
export type TipoCuenta = (typeof TIPOS)[number];

const CLAVES = [
  'nombre',
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
  'rendimientoAnualEsperado',
] as const;
export type Clave = (typeof CLAVES)[number];

const textos = Object.fromEntries(CLAVES.map((k) => [k, z.string()])) as Record<Clave, z.ZodString>;

export type Clase = 'monto' | 'entero' | 'porcentaje' | 'texto' | 'opciones';
export interface Descriptor {
  readonly n: Clave;
  readonly etiqueta: string;
  readonly clase: Clase;
  readonly requerido: boolean;
  readonly opciones?: Readonly<Record<string, string>>;
  /** Solo se muestra con este valor de otro campo (los días de "cada N días"). */
  readonly cuando?: readonly [Clave, string];
}

const d = (
  n: Clave,
  etiqueta: string,
  clase: Clase,
  requerido: boolean,
  extra: Pick<Descriptor, 'opciones' | 'cuando'> = {},
): Descriptor => ({ n, etiqueta, clase, requerido, ...extra });

export const CAMPOS_DE_TIPO: Readonly<Record<TipoCuenta, readonly Descriptor[]>> = {
  efectivo: [],
  tarjeta: [
    d('limiteCredito', t.limiteCredito, 'monto', true),
    d('tasaAnual', t.tasaAnual, 'porcentaje', false),
    d('diaCorte', t.diaCorte, 'entero', true),
    d('diaPago', t.diaPago, 'entero', true),
    d('red', t.red, 'opciones', true, { opciones: t.redes }),
    d('color', t.color, 'opciones', false, { opciones: t.colores }),
  ],
  prestamo: [
    d('contraparte', t.contraparte, 'texto', true),
    d('montoOriginal', t.montoOriginal, 'monto', true),
    d('tasaNominalAnual', t.tasaAnual, 'porcentaje', false),
    d('tipoTasa', t.tipoTasa, 'opciones', true, { opciones: t.tiposTasa }),
    d('frecuencia', t.frecuencia, 'opciones', true, { opciones: t.frecuencias }),
    d('frecuenciaDias', t.frecuenciaDias, 'entero', true, {
      cuando: ['frecuencia', 'cada_n_dias'],
    }),
    d('cuotaPactada', t.cuotaPactada, 'monto', true),
    d('plazoCuotas', t.plazoCuotas, 'entero', true),
    d('cuotasPagadasAlCrear', t.cuotasPagadas, 'entero', true),
    d('modeloCalculo', t.modelo, 'opciones', false, { opciones: t.modelos }),
  ],
  inversion: [d('rendimientoAnualEsperado', t.rendimiento, 'porcentaje', false)],
};

export const visible = (x: Descriptor, c: Readonly<Record<Clave, string>>): boolean =>
  x.cuando === undefined || c[x.cuando[0]] === x.cuando[1];

export const CONTRATO = z
  .object({ tipo: z.enum(TIPOS), signo: z.enum(['positivo', 'negativo']), ...textos })
  .superRefine((c, ctx) => {
    const obligatorios: Descriptor[] = [
      d('nombre', t.nombre, 'texto', true),
      d('saldo', t.saldo[c.tipo], 'monto', true),
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
  if (c.institucionId !== 'ninguna') salida['institucionId'] = c.institucionId;
  if (c.ultimos4.trim() !== '') salida['ultimos4'] = c.ultimos4.trim();
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
export const valoresIniciales = (hoy: string, tipo: TipoCuenta): Campos => ({
  ...(Object.fromEntries(CLAVES.map((k) => [k, ''])) as Record<Clave, string>),
  tipo,
  signo: 'positivo',
  institucionId: 'ninguna',
  fechaApertura: hoy,
  red: 'otra',
  color: SIN_ELEGIR,
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

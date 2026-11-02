// Los campos de `/cuentas/[cuentaId]/cuota` (FT-54): su contrato y la entrada de OP-24 (cuota y abono). Los valores del formulario
// son texto, como los escribe la persona (05 §4.2); los rechazos de negocio (`desglose_no_cuadra`, `capital_mayor_que_pendiente`…)
// son del servidor: la interfaz no suma ni compara montos (PF-3).
import * as z from 'zod';
import { normalizarMontoEscrito } from '../../formularios/normalizar-monto';
import { cuentasCuota as t } from '../../textos/cuentas-cuota';

export type Modalidad = 'cuota' | 'abono';

/** `?modalidad=` de la URL (05 §2.2): sin valor o con uno desconocido es una cuota. */
export const modalidadDe = (url: unknown): Modalidad => (url === 'abono' ? 'abono' : 'cuota');

const CAMPOS = z.object({
  origenId: z.string(),
  categoriaId: z.string(),
  fecha: z.string(),
  total: z.string(),
  capital: z.string(),
  interes: z.string(),
  seguro: z.string(),
});
export type Campos = z.infer<typeof CAMPOS>;

/** Los tres campos del desglose: lo que una propuesta nueva reemplaza si la persona no los editó. */
export const CAMPOS_DESGLOSE = ['capital', 'interes', 'seguro'] as const;
/** Los que puede traer una propuesta del modelo. */
export const CAMPOS_PROPUESTOS = ['total', ...CAMPOS_DESGLOSE] as const;

const escrito = (texto: string): boolean => normalizarMontoEscrito(texto).estado === 'valido';

/** El contrato de cada modalidad: lo obligatorio escrito. En un abono no hay desglose: todo el total es capital. */
export const contratoDe = (modalidad: Modalidad) =>
  CAMPOS.superRefine((c, ctx) => {
    const falta = (path: keyof Campos, message: string) => {
      ctx.addIssue({ code: 'custom', path: [path], message });
    };
    if (c.origenId === '') falta('origenId', t.elegirOrigen);
    if (c.categoriaId === '') falta('categoriaId', t.elegirCategoria);
    if (c.fecha === '') falta('fecha', t.completar);
    if (!escrito(c.total)) falta('total', t.completar);
    if (modalidad === 'cuota')
      for (const n of CAMPOS_DESGLOSE) if (!escrito(c[n])) falta(n, t.completar);
  });

const monto = (texto: string): string => {
  const r = normalizarMontoEscrito(texto);
  return r.estado === 'valido' ? r.texto : texto;
};

/** `useOperacion` entrega los campos más `modo`, `id` y la confirmación: la entrada de OP-24 sale de ellos. */
export function aEntradaDeAccion(
  modalidad: Modalidad,
  prestamoId: string,
  payload: unknown,
): Record<string, unknown> {
  const { modo, id, revisionVista, huellaImpacto, ...resto } = payload as Record<string, unknown>;
  const c = resto as Campos;
  return {
    modalidad,
    prestamoId,
    origenId: c.origenId,
    categoriaId: c.categoriaId,
    fecha: c.fecha,
    total: monto(c.total),
    ...(modalidad === 'cuota'
      ? { capital: monto(c.capital), interes: monto(c.interes), seguro: monto(c.seguro) }
      : {}),
    modo,
    id,
    ...(revisionVista === undefined ? {} : { revisionVista, huellaImpacto }),
  };
}

/** Lo que trae la consulta del desglose propuesto, ya como texto decimal (la consulta lo calcula; aquí no se suma). */
export interface Propuesta {
  readonly total: string;
  readonly capital: string;
  readonly interes: string;
  readonly seguro: string;
  readonly numeroCuota: number;
}

/** Los valores con que abre el formulario: la fecha es la de la URL o el `hoy` del servidor, nunca la del dispositivo (05 §5.5). */
export const valoresIniciales = (
  fecha: string,
  categoriaPropuesta: string | undefined,
  propuesta: Propuesta | undefined,
  cuotaPactada: string,
  modalidad: Modalidad,
): Campos => ({
  origenId: '',
  categoriaId: categoriaPropuesta ?? '',
  fecha,
  total: modalidad === 'cuota' ? (propuesta?.total ?? cuotaPactada) : '',
  capital: propuesta?.capital ?? '',
  interes: propuesta?.interes ?? '',
  seguro: propuesta?.seguro ?? '',
});

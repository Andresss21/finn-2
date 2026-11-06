// Los campos de `/registrar/{aporte,retiro,ajuste}-inversion` (FT-57), su contrato y la entrada de OP-25. Los valores del formulario
// son texto, como los escribe la persona (05 §4.2); el contrato completo lo aplica el servidor.
import * as z from 'zod';
import { aplicarSigno, normalizarMontoEscrito } from '../../formularios/normalizar-monto';
import { registrarInversion as t } from '../../textos/registrar-inversion';

export const TIPOS_DE_INVERSION = [
  'aporte-inversion',
  'retiro-inversion',
  'ajuste-inversion',
] as const;
export type TipoDeInversion = (typeof TIPOS_DE_INVERSION)[number];
export type Modalidad = 'aporte' | 'retiro' | 'ajuste';

/** `[tipo]` de la URL (05 §2.4) → el tipo de este flujo; cualquier otro lo atienden otras fichas. */
export const tipoDeInversion = (url: string): TipoDeInversion | undefined =>
  TIPOS_DE_INVERSION.find((x) => x === url);

export const modalidadDe = (tipo: TipoDeInversion): Modalidad =>
  tipo === 'aporte-inversion' ? 'aporte' : tipo === 'retiro-inversion' ? 'retiro' : 'ajuste';

/** El `tipo` de `formulario({ operacion: 'registrar' })` (04 §6). */
export const tipoDeFormulario = (
  tipo: TipoDeInversion,
): 'aporte_inversion' | 'retiro_inversion' | 'ajuste_inversion' => `${modalidadDe(tipo)}_inversion`;

const CAMPOS = z.object({
  inversionId: z.string(),
  cuentaId: z.string(),
  categoriaId: z.string(),
  fecha: z.string(),
  total: z.string(),
  signo: z.enum(['positivo', 'negativo']),
});
export type Campos = z.infer<typeof CAMPOS>;

/** El contrato de cada tipo: lo obligatorio escrito; los rechazos de negocio (`retiro_mayor_que_valor`…) son del servidor. */
export const contratoDe = (tipo: TipoDeInversion) =>
  CAMPOS.superRefine((c, ctx) => {
    const m = modalidadDe(tipo);
    const falta = (path: keyof Campos, message: string) => {
      ctx.addIssue({ code: 'custom', path: [path], message });
    };
    if (c.inversionId === '') falta('inversionId', t.elegirInversion);
    if (m !== 'ajuste' && c.cuentaId === '') falta('cuentaId', t.elegirCuenta);
    if (m === 'aporte' && c.categoriaId === '') falta('categoriaId', t.elegirCategoria);
    if (c.fecha === '') falta('fecha', t.completar);
    if (normalizarMontoEscrito(c.total).estado !== 'valido') falta('total', t.completar);
  });

const monto = (texto: string): string => {
  const r = normalizarMontoEscrito(texto);
  return r.estado === 'valido' ? r.texto : texto;
};

/** `useOperacion` entrega los campos más `modo`, `id` y la confirmación: la entrada de OP-25 sale de ellos. */
export function aEntradaDeAccion(tipo: TipoDeInversion, payload: unknown): Record<string, unknown> {
  const { modo, id, revisionVista, huellaImpacto, ...escrito } = payload as Record<string, unknown>;
  const c = escrito as Campos;
  const m = modalidadDe(tipo);
  return {
    modalidad: m,
    inversionId: c.inversionId,
    ...(m === 'ajuste' ? {} : { cuentaId: c.cuentaId }),
    ...(m === 'aporte' ? { categoriaId: c.categoriaId } : {}),
    fecha: c.fecha,
    total: m === 'ajuste' ? aplicarSigno(monto(c.total), c.signo) : monto(c.total),
    modo,
    id,
    ...(revisionVista === undefined ? {} : { revisionVista, huellaImpacto }),
  };
}

/** Los valores con que abre el formulario: la fecha es el `hoy` del servidor, nunca la del dispositivo (05 §5.5). */
export const valoresIniciales = (
  hoy: string,
  inversionPropuesta: string | undefined,
  cuentaPropuesta: string | undefined,
): Campos => ({
  inversionId: inversionPropuesta ?? '',
  cuentaId: cuentaPropuesta ?? '',
  categoriaId: '',
  fecha: hoy,
  total: '',
  signo: 'positivo',
});

// Los campos de `/registrar/ingreso` y `/registrar/transferencia` (FT-22, FT-23), su contrato y la entrada de OP-21 y OP-22.
// Los valores del formulario son texto, como los escribe la persona (05 §4.2); el contrato completo lo aplica el servidor.
import * as z from 'zod';
import { normalizarMontoEscrito } from '../../formularios/normalizar-monto';
import { registrarTipo as t } from '../../textos/registrar-tipo';

export const TIPOS_DE_REGISTRO = ['ingreso', 'transferencia'] as const;
export type TipoDeRegistro = (typeof TIPOS_DE_REGISTRO)[number];

/** `[tipo]` de la URL (05 §2.4) → el tipo de este flujo; cualquier otro lo atienden otras fichas. */
export const tipoDeRegistro = (url: string): TipoDeRegistro | undefined =>
  TIPOS_DE_REGISTRO.find((x) => x === url);

const CAMPOS = z.object({
  cuentaId: z.string(),
  origenId: z.string(),
  destinoId: z.string(),
  fecha: z.string(),
  total: z.string(),
  descripcion: z.string(),
});
export type Campos = z.infer<typeof CAMPOS>;

/** Qué cuentas pide cada tipo; el resto de los campos son comunes. */
const CUENTAS: Readonly<Record<TipoDeRegistro, readonly (keyof Campos)[]>> = {
  ingreso: ['cuentaId'],
  transferencia: ['origenId', 'destinoId'],
};

/** El contrato de cada tipo: lo obligatorio escrito; los rechazos de negocio (`cuentas_iguales`…) son del servidor. */
export const contratoDe = (tipo: TipoDeRegistro) =>
  CAMPOS.superRefine((c, ctx) => {
    for (const n of CUENTAS[tipo])
      if (c[n] === '') ctx.addIssue({ code: 'custom', path: [n], message: t.elegirCuenta });
    if (c.fecha === '') ctx.addIssue({ code: 'custom', path: ['fecha'], message: t.completar });
    if (normalizarMontoEscrito(c.total).estado !== 'valido')
      ctx.addIssue({ code: 'custom', path: ['total'], message: t.completar });
  });

const monto = (texto: string): string => {
  const r = normalizarMontoEscrito(texto);
  return r.estado === 'valido' ? r.texto : texto;
};

/** `useOperacion` entrega los campos más `modo`, `id` y la confirmación: la entrada de OP-21 u OP-22 sale de ellos. */
export function aEntradaDeAccion(tipo: TipoDeRegistro, payload: unknown): Record<string, unknown> {
  const { modo, id, revisionVista, huellaImpacto, ...escrito } = payload as Record<string, unknown>;
  const c = escrito as Campos;
  const comunes = { fecha: c.fecha, total: monto(c.total) };
  const propios =
    tipo === 'ingreso'
      ? {
          cuentaId: c.cuentaId,
          ...(c.descripcion.trim() === '' ? {} : { comercio: c.descripcion.trim() }),
        }
      : { origenId: c.origenId, destinoId: c.destinoId };
  return {
    ...propios,
    ...comunes,
    modo,
    id,
    ...(revisionVista === undefined ? {} : { revisionVista, huellaImpacto }),
  };
}

/** Los valores con que abre el formulario: la fecha es el `hoy` del servidor, nunca la del dispositivo (05 §5.5). */
export const valoresIniciales = (hoy: string, cuentaPropuesta: string | undefined): Campos => ({
  cuentaId: cuentaPropuesta ?? '',
  origenId: cuentaPropuesta ?? '',
  destinoId: '',
  fecha: hoy,
  total: '',
  descripcion: '',
});

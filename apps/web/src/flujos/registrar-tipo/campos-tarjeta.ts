// Los campos de `/registrar/entrada-tarjeta`, `/registrar/avance` y `/registrar/transferencia-deuda` (FT-32), su contrato y la
// entrada de OP-27. Los valores del formulario son texto, como los escribe la persona (05 §4.2); el contrato completo lo aplica el servidor.
import * as z from 'zod';
import { normalizarMontoEscrito } from '../../formularios/normalizar-monto';
import type { ValoresDeUrl } from '../../formularios/valores-de-url';
import { registrarTipo as t } from '../../textos/registrar-tipo';

/** `[tipo]` de la URL (05 §2.4) → modalidad de OP-27 y tipo de `formulario` (04 §6.14.1). */
export const TIPOS = {
  'entrada-tarjeta': { modalidad: 'entrada', formulario: 'entrada_tarjeta' },
  avance: { modalidad: 'avance', formulario: 'avance' },
  'transferencia-deuda': { modalidad: 'transferencia_deuda', formulario: 'transferencia_deuda' },
} as const;
export type TipoDeTarjeta = keyof typeof TIPOS;

export const tipoDeTarjeta = (url: string): TipoDeTarjeta | undefined =>
  (Object.keys(TIPOS) as TipoDeTarjeta[]).find((x) => x === url);

const CAMPOS = z.object({
  tarjetaId: z.string(),
  cuentaId: z.string(),
  tarjetaDestinoId: z.string(),
  fecha: z.string(),
  total: z.string(),
});
export type Campos = z.infer<typeof CAMPOS>;

/** Qué cuentas pide cada tipo; la fecha y el monto son comunes. */
const CUENTAS: Readonly<Record<TipoDeTarjeta, readonly (keyof Campos)[]>> = {
  'entrada-tarjeta': ['tarjetaId'],
  avance: ['tarjetaId', 'cuentaId'],
  'transferencia-deuda': ['tarjetaId', 'tarjetaDestinoId'],
};

/** El contrato de cada tipo: lo obligatorio escrito; los rechazos de negocio (`cuentas_iguales`…) son del servidor. */
export const contratoDe = (tipo: TipoDeTarjeta) =>
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

/** `useOperacion` entrega los campos más `modo`, `id` y la confirmación: la entrada de OP-27 sale de ellos. */
export function aEntradaDeAccion(
  tipo: TipoDeTarjeta,
  payload: unknown,
  comercio?: string,
): Record<string, unknown> {
  const { modo, id, revisionVista, huellaImpacto, ...escrito } = payload as Record<string, unknown>;
  const c = escrito as Campos;
  const propios =
    tipo === 'avance'
      ? { cuentaId: c.cuentaId }
      : tipo === 'transferencia-deuda'
        ? { tarjetaDestinoId: c.tarjetaDestinoId }
        : {};
  return {
    modalidad: TIPOS[tipo].modalidad,
    tarjetaId: c.tarjetaId,
    ...propios,
    fecha: c.fecha,
    total: monto(c.total),
    ...(comercio === undefined ? {} : { comercio }),
    modo,
    id,
    ...(revisionVista === undefined ? {} : { revisionVista, huellaImpacto }),
  };
}

/** Los valores con que abre el formulario: la fecha es el `hoy` del servidor, nunca la del dispositivo (05 §5.5). */
export const valoresIniciales = (
  hoy: string,
  tarjetaPropuesta: string | undefined,
  inicial: ValoresDeUrl = {},
): Campos => ({
  tarjetaId: tarjetaPropuesta ?? '',
  cuentaId: '',
  tarjetaDestinoId: '',
  fecha: inicial.fecha ?? hoy,
  total: inicial.total ?? '',
});

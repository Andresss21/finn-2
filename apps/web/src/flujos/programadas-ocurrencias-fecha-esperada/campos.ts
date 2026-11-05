// Campos de la ocurrencia (FT-41, OP-43): los editables según el tipo (05 §2): el monto, las partes de un gasto con varias o el monto
// y el desglose de una cuota. Texto (05 §4.2); la suma, el cuadre y los rechazos son del servidor (PF-3).
import * as z from 'zod';
import { normalizarMontoEscrito } from '../../formularios/normalizar-monto';
import { programadas } from '../../textos/programadas';

export type Edicion = 'monto' | 'partes' | 'cuota';

export interface Parte {
  readonly categoriaId: string;
  readonly categoria: string;
}

export const CONTRATO = z.object({
  monto: z.string(),
  partes: z.array(z.string()),
  capital: z.string(),
  interes: z.string(),
  seguro: z.string(),
});
export type Campos = z.infer<typeof CONTRATO>;

const escrito = (texto: string): boolean => normalizarMontoEscrito(texto).estado === 'valido';
const monto = (texto: string): string => {
  const r = normalizarMontoEscrito(texto);
  return r.estado === 'valido' ? r.texto : texto;
};

/** Lo obligatorio, según lo que se edita: lo demás no se muestra y no se exige. */
export const contratoDe = (edicion: Edicion) =>
  CONTRATO.superRefine((c, ctx) => {
    const falta = (path: (string | number)[]) => {
      ctx.addIssue({ code: 'custom', path, message: programadas.obligatorio });
    };
    if (edicion !== 'partes' && !escrito(c.monto)) falta(['monto']);
    if (edicion === 'partes')
      c.partes.forEach((p, i) => {
        if (!escrito(p)) falta(['partes', i]);
      });
    if (edicion === 'cuota')
      for (const n of ['capital', 'interes', 'seguro'] as const) if (!escrito(c[n])) falta([n]);
  });

/** La entrada de OP-43: solo lo que el tipo permite editar; el servidor usa los datos de la programada para lo demás. */
export function aEntradaDeAccion(
  edicion: Edicion,
  programadaId: string,
  fechaEsperada: string,
  partes: readonly Parte[],
  payload: unknown,
): Record<string, unknown> {
  const { modo, id, revisionVista, huellaImpacto, ...resto } = payload as Record<string, unknown>;
  const c = resto as Campos;
  return {
    programadaId,
    fechaEsperada,
    ...(edicion === 'partes'
      ? {
          lineas: partes.map((p, i) => ({
            categoriaId: p.categoriaId,
            monto: monto(c.partes[i] ?? ''),
          })),
        }
      : { monto: monto(c.monto) }),
    ...(edicion === 'cuota'
      ? {
          desglose: {
            capital: monto(c.capital),
            interes: monto(c.interes),
            seguro: monto(c.seguro),
          },
        }
      : {}),
    modo,
    id,
    ...(revisionVista === undefined ? {} : { revisionVista, huellaImpacto }),
  };
}

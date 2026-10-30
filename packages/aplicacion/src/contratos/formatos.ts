// Contratos de OPT-05, OPT-06 y OPT-07 (04 §3.10, §8.7; 03 §3.21). La política del patrón (compila, banderas, grupos,
// retroceso) no es de Zod: la aplica `validarFormato` de @finn/sms (04 §8.5) y su rechazo llega como `VALIDACION`.
import * as z from 'zod';
import { textoLimpio, uuid } from './comunes.ts';

const FORMATOS_FECHA = ['AAAA/MM/DD', 'AAAAMMDD', 'AAAA-MM-DD', 'DD/MM/AAAA'] as const;

/** Los campos de un formato, con los nombres de 03 §3.21 en camelCase (`activo` por defecto verdadero). */
const camposFormato = {
  institucionId: uuid,
  nombre: textoLimpio,
  tipoMovimiento: z.enum(['compra', 'deposito', 'pago_tarjeta', 'devolucion'], {
    error: 'Elegí el tipo de movimiento.',
  }),
  patron: z
    .string({ error: 'Ingresá el patrón.' })
    .min(1, { error: 'Ingresá el patrón.' })
    .max(1000, { error: 'El patrón no puede pasar de 1000 caracteres.' }),
  banderas: z.string({ error: 'Las banderas no son válidas.' }),
  montoSeparadorMiles: z.enum([',', '.', ''], { error: 'Elegí el separador de miles.' }),
  montoSeparadorDecimal: z.enum(['.', ','], { error: 'Elegí el separador decimal.' }),
  formatosFecha: z.array(z.enum(FORMATOS_FECHA, { error: 'El formato de fecha no es válido.' })),
};

const DISTINTOS = 'El separador decimal debe ser distinto del de miles.';
const distintos = (f: { montoSeparadorMiles: string; montoSeparadorDecimal: string }): boolean =>
  f.montoSeparadorMiles !== f.montoSeparadorDecimal;

/** OPT-05: el id lo elige el cliente (4.6.1); si existe, edita, activa o desactiva; si no, crea. */
export const optFormato = z
  .strictObject({
    id: uuid,
    ...camposFormato,
    activo: z.boolean({ error: 'Indicá si está activo.' }),
  })
  .refine(distintos, { error: DISTINTOS, path: ['montoSeparadorDecimal'] });
export type EntradaFormato = z.output<typeof optFormato>;

/** OPT-06: el formato guardado (`formatoId`) o el que se está editando (`formato`), contra un SMS (6.14.4). */
export const optProbar = z
  .strictObject({
    smsId: uuid,
    formatoId: uuid.optional(),
    formato: z.strictObject(camposFormato).optional(),
  })
  .refine((e) => (e.formatoId === undefined) !== (e.formato === undefined), {
    error: 'Indicá el formato guardado o el que estás editando.',
    path: ['formato'],
  });
export type EntradaProbar = z.output<typeof optProbar>;

/** OPT-07: crear o renombrar; el nombre es único sin distinguir mayúsculas (8.7). */
export const optInstitucion = z.strictObject({ id: uuid, nombre: textoLimpio });
export type EntradaInstitucion = z.output<typeof optInstitucion>;

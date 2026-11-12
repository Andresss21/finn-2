// Código TOTP (05 §9.4 y §9.5 [CH-241]): lo comparten Verificar, Inscribir y Agregar factor.
import * as z from 'zod';
import { codigoTotp as t } from '../../textos/codigo-totp';

export const CASILLAS = 6;

/** Al pegar "123 456" o "123-456" se quitan los espacios y los guiones; lo que no es un dígito no entra en una casilla. */
export const normalizarCodigo = (texto: string): string => texto.replace(/\D/g, '');

/** El campo `codigo` del contrato: con menos de 6 dígitos, dice cuántos faltan (E2-2). */
export const campoCodigo = z.string().regex(/^\d{6}$/, {
  error: (problema) =>
    t.faltan(Math.max(1, CASILLAS - normalizarCodigo(problema.input ?? '').length)),
});

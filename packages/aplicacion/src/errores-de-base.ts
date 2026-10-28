// Traducción de los rechazos de la base (04 §7.3, §7.4; BE-25). Vive fuera de `errores/` porque importa `@finn/db`
// y `errores/` no puede llegar a código de servidor (04 §1.4, regla `contratos-sin-servidor`).
import { sqlstateDe } from '@finn/db';
import { MENSAJE_OCUPADO, mensajeInterno, type ErrorFinn } from './errores/tipos.ts';

/**
 * Un rechazo de la base es un error interno: el motor ya validó y hay desacuerdo entre dos implementaciones de una
 * regla (BE-25). Solo `55P03` y `40P01` son `OCUPADO` (el reintento de 4.7 lo decide quien llama). `null` si el
 * error no viene de la base. El mensaje de la base nunca decide nada (DB-23).
 */
export function errorDeBase(error: unknown, idError: string): ErrorFinn | null {
  const e = sqlstateDe(error);
  if (e === null) return null;
  const ocupado = e.sqlstate === '55P03' || e.sqlstate === '40P01';
  return {
    categoria: ocupado ? 'OCUPADO' : 'INTERNO',
    codigo: e.sqlstate,
    mensaje: ocupado ? MENSAJE_OCUPADO : mensajeInterno(idError),
    idError,
  };
}

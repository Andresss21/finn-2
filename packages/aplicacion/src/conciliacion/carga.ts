// Carga firmada de la conciliación (04 §9.6; BE-49, P4-14). Portada del prototipo verificado en V-26
// (docs/anexos/04-backend-verificacion/t14.ts): `<version>.<cuerpo>.<mac>`, cuerpo en JSON canónico y base64url, mac
// HMAC-SHA256 sobre `finn-conciliacion.<version>.<cuerpo>`. La verificación sigue el orden de 9.6: versión conocida,
// mac con `timingSafeEqual`, cuenta y vencimiento. Las claves y el mac nunca salen en un mensaje ni en un registro.
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { EstadoNormalizado } from '@finn/conciliacion';
import type { Uuid } from '@finn/dominio';
import type { Configuracion } from '../config/index.ts';
import { ExcepcionFinn, mensajeDeRechazo } from '../errores/index.ts';
import { ErrorValidacion } from '../operaciones/marco.ts';

/** La de la configuración (04 §14.2): la versión activa y las claves en base64 por versión. */
export type ClavesConciliacion = Configuracion['conciliacion'];

/** Lo que OP-45 a OP-47 reciben del servidor: las claves y su reloj (control técnico, no fecha de negocio; L20). */
export interface DepsConciliacion {
  readonly claves: ClavesConciliacion;
  readonly ahoraMs: () => number;
}

/** `vence` = instante de OP-45 + 24 h (9.6). */
export const VIGENCIA_MS = 24 * 60 * 60 * 1000;

/** JSON canónico: claves ordenadas, sin espacios; una clave con `undefined` no se escribe. */
const canonico = (v: unknown): string => {
  if (Array.isArray(v)) return `[${v.map(canonico).join(',')}]`;
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  const o = v as Record<string, unknown>;
  const claves = Object.keys(o)
    .filter((k) => o[k] !== undefined)
    .sort();
  return `{${claves.map((k) => `${JSON.stringify(k)}:${canonico(o[k])}`).join(',')}}`;
};

const macDe = (claveBase64: string, version: string, cuerpo: string): Buffer =>
  createHmac('sha256', Buffer.from(claveBase64, 'base64'))
    .update(`finn-conciliacion.${version}.${cuerpo}`)
    .digest();

/** Firma el estado para la cuenta con la clave activa. */
export function firmarCarga(
  claves: ClavesConciliacion,
  cuentaId: Uuid,
  estado: EstadoNormalizado,
  venceMs: number,
): string {
  const version = claves.activa;
  const clave = claves.claves[version];
  if (clave === undefined)
    throw new Error('la clave activa de la conciliación no está en la lista');
  const datos = { ...estado, v: version, cuentaId, vence: venceMs };
  const cuerpo = Buffer.from(canonico(datos), 'utf8').toString('base64url');
  return `${version}.${cuerpo}.${macDe(clave, version, cuerpo).toString('base64url')}`;
}

/**
 * Verifica la carga para `cuentaId`. Con `ahoraMs` en `null` no mira el vencimiento (la comprobación de idempotencia:
 * una repetición después de 24 h devuelve lo ya aplicado).
 */
export function verificarCarga(
  claves: ClavesConciliacion,
  carga: string,
  cuentaId: Uuid,
  ahoraMs: number | null,
): EstadoNormalizado | 'firma_no_valida' | 'firma_vencida' {
  const partes = carga.split('.');
  const [version = '', cuerpo = '', mac = ''] = partes;
  const clave = Object.hasOwn(claves.claves, version) ? claves.claves[version] : undefined;
  if (partes.length !== 3 || clave === undefined) return 'firma_no_valida';
  const esperado = macDe(clave, version, cuerpo);
  const recibido = Buffer.from(mac, 'base64url');
  // Con otra longitud se rechaza antes: `timingSafeEqual` exige buffers del mismo tamaño
  if (recibido.length !== esperado.length || !timingSafeEqual(recibido, esperado))
    return 'firma_no_valida';
  let datos: { v?: unknown; cuentaId?: unknown; vence?: unknown } & EstadoNormalizado;
  try {
    datos = JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8')) as typeof datos;
  } catch {
    return 'firma_no_valida';
  }
  if (datos.v !== version || datos.cuentaId !== cuentaId || typeof datos.vence !== 'number')
    return 'firma_no_valida';
  if (ahoraMs !== null && datos.vence < ahoraMs) return 'firma_vencida';
  const { formato, fechaEstado, saldoFinal, movimientos } = datos;
  return { formato, fechaEstado, saldoFinal, movimientos };
}

/** `verificarCarga` para OP-46 y OP-47: un fallo es el rechazo `DOMINIO` con su código y su mensaje (7.5). */
export function abrirCarga(
  d: DepsConciliacion,
  carga: string,
  cuentaId: Uuid,
  conVencimiento: boolean,
): EstadoNormalizado {
  const r = verificarCarga(d.claves, carga, cuentaId, conVencimiento ? d.ahoraMs() : null);
  if (typeof r !== 'string') return r;
  const mensaje = mensajeDeRechazo({ codigo: r }) ?? r;
  throw new ExcepcionFinn({ categoria: 'DOMINIO', codigo: r, mensaje });
}

/** El movimiento de la carga con ese índice (04 §3.8: "el movimiento pertenece a la carga"). */
export function movimientoDe(estado: EstadoNormalizado, indice: number, campo: string) {
  const m = estado.movimientos.find((x) => x.indice === indice);
  if (m === undefined)
    throw new ErrorValidacion(campo, 'Ese movimiento no está en el estado de cuenta.');
  return m;
}

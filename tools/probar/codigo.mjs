// `pnpm probar:codigo` (TA-597): el código TOTP vigente del usuario de prueba de la app que dejó `pnpm probar` arriba.
import { codigoDe } from '../../apps/web/e2e/ayudas/totp.ts';
import { leerEstado } from '../pruebas/e2e/local.ts';

const estado = leerEstado();
const secreto = estado?.entorno.E2E_TOTP_SECRETO;
if (!secreto) {
  console.error('probar: no hay una app de `pnpm probar` arriba (falta su entorno temporal)');
  process.exit(1);
}
console.log(codigoDe(secreto));

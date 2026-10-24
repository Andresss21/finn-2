// Control negativo de TA-003: debe fallar con la regla indicada.
// ruta: apps/web/src/app/x.ts
// regla: @typescript-eslint/no-restricted-imports
// depcruise: web-no-db-sms-conciliacion
import { escribir } from '@finn/db';
export const e = escribir;

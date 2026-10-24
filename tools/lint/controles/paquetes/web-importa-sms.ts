// Control negativo de TA-003: debe fallar con la regla indicada.
// ruta: apps/web/src/x.ts
// regla: @typescript-eslint/no-restricted-imports
// depcruise: web-no-db-sms-conciliacion
import { interpretar } from '@finn/sms';
export const i = interpretar;

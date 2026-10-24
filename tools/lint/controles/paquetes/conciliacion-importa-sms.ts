// Control negativo de TA-003: debe fallar con la regla indicada.
// ruta: packages/conciliacion/src/x.ts
// regla: @typescript-eslint/no-restricted-imports
// depcruise: conciliacion-solo-dominio
import { interpretar } from '@finn/sms';
export const i = interpretar;

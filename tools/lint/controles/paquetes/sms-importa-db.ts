// Control negativo de TA-003: debe fallar con la regla indicada.
// ruta: packages/sms/src/x.ts
// regla: @typescript-eslint/no-restricted-imports
// depcruise: sms-solo-dominio
import { escribir } from '@finn/db';
export const e = escribir;

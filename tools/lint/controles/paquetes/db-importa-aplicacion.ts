// Control negativo de TA-003: debe fallar con la regla indicada.
// ruta: packages/db/src/x.ts
// regla: @typescript-eslint/no-restricted-imports
// depcruise: db-solo-dominio
import { operar } from '@finn/aplicacion';
export const o = operar;

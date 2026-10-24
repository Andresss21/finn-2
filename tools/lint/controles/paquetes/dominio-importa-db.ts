// Control negativo de TA-003: debe fallar con la regla indicada.
// ruta: packages/dominio/src/x.ts
// regla: @typescript-eslint/no-restricted-imports
// depcruise: dominio-aislado
import { escribir } from '@finn/db';
export const e = escribir;

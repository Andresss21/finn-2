// Control negativo de TA-003: debe fallar con la regla indicada.
// ruta: packages/aplicacion/src/contratos/x.ts
// regla: ninguna
// depcruise: contratos-sin-servidor
import { escribir } from '@finn/db';
export const e = escribir;

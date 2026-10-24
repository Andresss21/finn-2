// Control negativo de TA-003: debe fallar con la regla indicada.
// ruta: packages/aplicacion/src/operaciones/x.ts
// regla: @typescript-eslint/no-restricted-imports
// depcruise: aplicacion-no-web
import { pagina } from '@finn/web';
export const p = pagina;

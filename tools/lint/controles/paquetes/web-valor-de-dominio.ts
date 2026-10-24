// Control negativo de TA-003: debe fallar con la regla indicada.
// ruta: apps/web/src/x.ts
// regla: @typescript-eslint/no-restricted-imports
// depcruise: web-dominio-solo-tipos
import { calcular } from '@finn/dominio';
export const c = calcular;

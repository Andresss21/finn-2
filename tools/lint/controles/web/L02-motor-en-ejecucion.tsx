// Control negativo de TA-004: debe fallar con la regla indicada.
// ruta: apps/web/src/flujos/gasto/lector.tsx
// regla: @typescript-eslint/no-restricted-imports
import { calcular } from '@finn/dominio';
export const lector = calcular;

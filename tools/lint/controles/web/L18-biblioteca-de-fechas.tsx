// Control negativo de TA-004: debe fallar con la regla indicada.
// ruta: apps/web/src/componentes/dominio/fecha.tsx
// regla: @typescript-eslint/no-restricted-imports
import { format } from 'date-fns';
export const f = format;

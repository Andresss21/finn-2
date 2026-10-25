// Control negativo de TA-004: debe fallar con la regla indicada.
// ruta: apps/web/src/formularios/esquema.tsx
// regla: no-restricted-syntax
import { z } from 'zod';
export const esquema = z.string();

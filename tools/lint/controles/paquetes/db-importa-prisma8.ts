// Control negativo de TA-003: debe fallar con la regla indicada.
// ruta: packages/db/src/x.ts
// regla: @typescript-eslint/no-restricted-imports
// depcruise: prisma-8
import { cliente } from '@prisma/orm-client';
export const c = cliente;

// Control negativo de TA-003: debe fallar con la regla indicada.
// ruta: packages/aplicacion/src/operaciones/x.ts
// regla: @typescript-eslint/no-restricted-imports
// depcruise: prisma-solo-db
import { PrismaClient } from '@prisma/adapter-pg';
export const p = PrismaClient;

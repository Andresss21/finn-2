// Control negativo de TA-003: debe fallar con la regla indicada.
// ruta: apps/web/src/app/x.ts
// regla: @typescript-eslint/no-restricted-imports
// depcruise: prisma-solo-db
import { PrismaClient } from '@prisma/client';
export const p = PrismaClient;

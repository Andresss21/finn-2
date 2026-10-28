// Control negativo de CH-28: un import de valor de la API de dominio desde db debe fallar con la regla indicada.
// ruta: packages/db/src/x.ts
// regla: @typescript-eslint/no-restricted-imports
// depcruise: db-dominio-solo-tipos
import { calcular } from '@finn/dominio';
export const c = calcular;

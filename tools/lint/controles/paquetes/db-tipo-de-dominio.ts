// Control limpio de CH-28: un `import type` de la API de dominio desde db no debe violar ninguna regla (04 §1.3).
// ruta: packages/db/src/y.ts
// regla: ninguna
// depcruise: ninguna
import type { Hechos } from '@finn/dominio';
export type H = Hechos;

// Control negativo de TA-003: debe fallar con la regla indicada.
// ruta: packages/dominio/src/x.ts
// regla: ninguna
// depcruise: dominio-aislado
export const cargar = () => import('@finn/db');

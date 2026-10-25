// Control negativo de TA-004: debe fallar con la regla indicada.
// ruta: apps/web/src/componentes/dominio/hora.tsx
// regla: no-restricted-globals
export const instante = (n: number): Date => new Date(n);

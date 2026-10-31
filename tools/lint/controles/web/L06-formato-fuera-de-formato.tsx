// Control negativo de TA-004: debe fallar con la regla indicada.
// ruta: apps/web/src/componentes/dominio/fila-de-control.tsx
// regla: no-restricted-syntax
export const f = new Intl.NumberFormat('es-CL');
export const g = (n: number): string => n.toLocaleString('es-CL');

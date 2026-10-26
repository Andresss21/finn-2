// Control negativo de TA-004: debe fallar con la regla indicada.
// ruta: apps/web/src/componentes/marco/tema.tsx
// regla: no-restricted-globals
export const leer = (): string | null => sessionStorage.getItem('tema');

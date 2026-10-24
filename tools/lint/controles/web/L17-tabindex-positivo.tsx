// Control negativo de TA-004: debe fallar con la regla indicada.
// ruta: apps/web/src/componentes/dominio/foco.tsx
// regla: jsx-a11y/tabindex-no-positive
export const Foco = () => <div tabIndex={2}>{null}</div>;

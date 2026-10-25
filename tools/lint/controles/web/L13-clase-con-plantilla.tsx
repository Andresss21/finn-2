// Control negativo de TA-004: debe fallar con la regla indicada.
// ruta: apps/web/src/componentes/dominio/estado.tsx
// regla: no-restricted-syntax
export const Estado = ({ estado }: { estado: string }) => (
  <p className={`text-${estado}-texto`}>{null}</p>
);

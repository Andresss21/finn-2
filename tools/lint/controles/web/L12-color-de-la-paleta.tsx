// Control negativo de TA-004: debe fallar con la regla indicada.
// ruta: apps/web/src/componentes/dominio/aviso.tsx
// regla: no-restricted-syntax
export const Aviso = () => <p className="text-red-600">{null}</p>;

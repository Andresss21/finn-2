// Control negativo de TA-004: debe fallar con la regla indicada.
// ruta: apps/web/src/componentes/dominio/caja.tsx
// regla: no-restricted-syntax
export const Caja = () => <div className="p-[13px] duration-[250ms]">{null}</div>;

// Control negativo de TA-004: debe fallar con la regla indicada.
// ruta: apps/web/src/componentes/dominio/boton.tsx
// regla: finn/jsx-deshabilitado
export const Boton = () => <button className="text-texto-deshabilitado">{null}</button>;

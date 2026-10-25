// Control negativo de TA-004: debe fallar con la regla indicada.
// ruta: apps/web/src/componentes/dominio/total.tsx
// regla: finn/centavos
type Centavos = number & { readonly marca: 'Centavos' };
export const total = (a: Centavos, b: Centavos): number => a + b;
export const mitad = (a: Centavos): number => a / 2;

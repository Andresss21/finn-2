// Control negativo de TA-003: debe fallar con la regla indicada.
// ruta: packages/dominio/src/x.ts
// regla: finn/dinero
// depcruise: ninguna
type Centavos = number & { readonly marca: 'Centavos' };
export const mitad = (c: Centavos) => c / 2;

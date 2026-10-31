'use client';
// La hoja «Más secciones» se descarga al abrirla (05 §13.3: `import()` para lo que no se usa al abrir): Radix Dialog
// no entra en el JS compartido de todas las rutas. `precargar()` la pide antes del toque (puntero o foco sobre el botón
// ☰, o un momento libre tras hidratar) para que la primera apertura no espere la red.
import { lazy, Suspense, type ComponentProps } from 'react';

const cargar = () => import('../marco/superpuesto').then((m) => ({ default: m.Superpuesto }));
const SuperpuestoCargado = lazy(cargar);

export const precargar = (): void => {
  void cargar();
};

/** Mismo contrato que `Superpuesto`; mientras llega el módulo no dibuja nada (el toque ya está registrado en el estado). */
export function SuperpuestoDiferido(props: ComponentProps<typeof SuperpuestoCargado>) {
  return (
    <Suspense fallback={null}>
      <SuperpuestoCargado {...props} />
    </Suspense>
  );
}

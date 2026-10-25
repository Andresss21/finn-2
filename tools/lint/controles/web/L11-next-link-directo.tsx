// Control negativo de TA-004: debe fallar con la regla indicada.
// ruta: apps/web/src/componentes/dominio/enlace.tsx
// regla: @typescript-eslint/no-restricted-imports
import Link from 'next/link';
export const e = Link;

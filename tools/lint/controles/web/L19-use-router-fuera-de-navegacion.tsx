// Control negativo de TA-004: debe fallar con la regla indicada.
// ruta: apps/web/src/componentes/dominio/atras.tsx
// regla: @typescript-eslint/no-restricted-imports
import { useRouter } from 'next/navigation';
export const r = useRouter;

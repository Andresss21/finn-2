// Control negativo de TA-004: debe fallar con la regla indicada.
// ruta: apps/web/src/componentes/dominio/dialogo.tsx
// regla: @typescript-eslint/no-restricted-imports
import * as Dialog from '@radix-ui/react-dialog';
export const d = Dialog;

// Textos de `/cuentas/nueva` (FT-50; 05 §12): los de siempre y los de los campos de cada tipo, juntos para las pruebas y las otras
// pantallas. El formulario importa las dos partes por separado para no cargar la segunda con efectivo (05 §13.1).
import { cuentasNuevaBase } from './cuentas-nueva-base.ts';
import { cuentasNuevaTipos } from './cuentas-nueva-tipos.ts';

export const cuentasNueva = { ...cuentasNuevaBase, ...cuentasNuevaTipos } as const;

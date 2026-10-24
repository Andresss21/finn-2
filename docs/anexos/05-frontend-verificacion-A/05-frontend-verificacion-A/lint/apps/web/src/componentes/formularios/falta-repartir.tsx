import { sumar, restar } from '@finn/dominio/valores';          // permitido: formulario
import type { Centavos } from '@finn/dominio/valores';
export const x = (a: Centavos, b: Centavos) => restar(a, sumar(a, b));

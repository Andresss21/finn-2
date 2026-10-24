import type { Centavos } from '@finn/dominio/valores';          // permitido: solo tipo
import { sumar } from '@finn/dominio/valores';                  // prohibido
import { type Centavos as C2 } from '@finn/dominio/valores';    // permitido: especificador de tipo
export const y = (a: Centavos, b: C2) => sumar(a, b);

// La memoria de la instancia (04 §5.3, BE-22) para los adaptadores de `apps/web`, que no pueden importar `@finn/db`.
// Una sola por módulo: está indexada por revisión, así que dos copias del módulo solo cargarían de más, nunca distinto.
import { Memoria } from '@finn/db';

export const memoriaDeInstancia = new Memoria();

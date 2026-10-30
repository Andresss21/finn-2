// El arnés de PostgreSQL para las pruebas `RH` (07 §1, §2.3): viven en `apps/web`, que no ve `@finn/db` (04 §1.3), y
// necesitan una base de prueba. Solo expone la base y SQL de lectura para comprobar lo que quedó guardado.
export { consultar, crearBasePrueba } from '../../packages/db/test/ayudantes/base.ts';

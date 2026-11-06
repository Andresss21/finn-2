// Lector de la lista de `/ajustes/seguridad` (05 §7.3, CP-4): `estadoSeguridad()` pasa por `consultar()`, el único que traduce sus
// errores. Va en su propio `Suspense` (05 §7, excepción de Ajustes > Seguridad).
import { consultar } from '../../../../servidor/consultar';
import { estadoSeguridad } from '../../../../servidor/sesion';
import { ListaFactores } from './lista-factores';

export async function LectorFactores() {
  const estado = await consultar(() => estadoSeguridad());
  return <ListaFactores factores={estado.factores} />;
}

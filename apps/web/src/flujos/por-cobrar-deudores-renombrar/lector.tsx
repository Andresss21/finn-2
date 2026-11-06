// Lector de `/por-cobrar/deudores/[deudorId]/renombrar` (05 §4.1): `porCobrar({ incluirCerrados })` con los cerrados, porque un
// deudor con todo cobrado también se renombra; el nombre vigente del deudor es el `esperado` (4.6.2). Un deudor que no existe
// no se abre: `notFound()`. Lo único que traduce los errores de la consulta es `consultar()` (CP-13).
import { porCobrar } from '@finn/aplicacion/consultas/por-cobrar';
import { notFound } from 'next/navigation';
import { renombrarDeudor } from '../../servidor/acciones/eventos';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { FormularioPorCobrarRenombrar } from './formulario';

export async function LectorPorCobrarRenombrar({ deudorId }: { readonly deudorId: string }) {
  const dto = await consultar(async () =>
    porCobrar(await depsDeConsulta(), { incluirCerrados: true }),
  );
  const deudor = dto.deudores.find((d) => d.deudor.id === deudorId)?.deudor;
  if (deudor === undefined) return notFound();
  return (
    <FormularioPorCobrarRenombrar
      accion={renombrarDeudor}
      deudorId={deudor.id}
      nombre={deudor.nombre}
    />
  );
}

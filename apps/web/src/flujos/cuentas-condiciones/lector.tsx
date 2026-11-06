// Lector de `/cuentas/[cuentaId]/condiciones` (05 §2.7, §4.1): `formulario({ operacion: 'cuenta', cuentaId })`; `consultar()`
// traduce los errores. Solo préstamos: cualquier otra cuenta vuelve a su detalle.
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { notFound, redirect } from 'next/navigation';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { camposDe } from './campos';
import { FormularioCuentasCondiciones } from './formulario';

export async function LectorCuentasCondiciones({ cuentaId }: { readonly cuentaId: string }) {
  const dto = await consultar(
    async () => formulario(await depsDeConsulta(), { operacion: 'cuenta', cuentaId }),
    { validacionDeSegmento: true },
  );
  if (!('cuenta' in dto.contexto)) notFound(); // con `cuentaId` siempre viene; el tipo no lo sabe
  const cuenta: Readonly<Record<string, unknown>> = dto.contexto.cuenta;
  if (cuenta['tipo'] !== 'prestamo') redirect(`/cuentas/${cuentaId}`);
  return <FormularioCuentasCondiciones prestamoId={cuentaId} visto={camposDe(cuenta)} />;
}

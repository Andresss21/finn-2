// Lector de `/cuentas/[cuentaId]/eliminar` (05 §2.7, §4.1): llama a `detalleCuenta({ cuentaId })` (lo que pide OP-06:
// `acciones.bloqueosEliminar` y las programadas que usan la cuenta) y pasa el DTO al formulario. Los errores los traduce `consultar()`.
import { detalleCuenta } from '@finn/aplicacion/consultas/detalle-cuenta';
import { eliminarCuenta } from '../../servidor/acciones/cuentas';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { FormularioCuentasEliminar } from './formulario';

export async function LectorCuentasEliminar({ cuentaId }: { readonly cuentaId: string }) {
  const dto = await consultar(async () => detalleCuenta(await depsDeConsulta(), { cuentaId }), {
    validacionDeSegmento: true,
  });
  return (
    <FormularioCuentasEliminar
      accion={eliminarCuenta}
      cuentaId={cuentaId}
      nombre={dto.cuenta.nombre}
      archivada={dto.cuenta.archivada}
      programadas={dto.programadas.length}
      bloqueos={dto.acciones.bloqueosEliminar}
    />
  );
}

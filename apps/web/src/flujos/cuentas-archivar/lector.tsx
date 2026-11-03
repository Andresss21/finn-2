// Lector de `/cuentas/[cuentaId]/archivar` (05 §2.7, §4.1): llama a `detalleCuenta({ cuentaId })` (lo que pide OP-04: saldo, deuda,
// reserva y `acciones.bloqueosArchivo`) y pasa el DTO al formulario. Lo único que traduce los errores es `consultar()` (CP-13).
import { detalleCuenta } from '@finn/aplicacion/consultas/detalle-cuenta';
import { archivarCuenta } from '../../servidor/acciones/cuentas';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { FormularioCuentasArchivar } from './formulario';

export async function LectorCuentasArchivar({ cuentaId }: { readonly cuentaId: string }) {
  const dto = await consultar(async () => detalleCuenta(await depsDeConsulta(), { cuentaId }), {
    validacionDeSegmento: true,
  });
  return (
    <FormularioCuentasArchivar
      accion={archivarCuenta}
      cuentaId={cuentaId}
      nombre={dto.cuenta.nombre}
      esTarjeta={dto.cuenta.tipo === 'tarjeta'}
      saldo={dto.saldo}
      deuda={dto.tarjeta?.deuda}
      reservado={dto.tarjeta?.reservado}
      bloqueos={dto.acciones.bloqueosArchivo}
    />
  );
}

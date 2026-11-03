// Lector de `/cuentas/ordenar` (05 §4.1): `cuentas()` trae las abiertas por tipo, en el orden de OP-03; `consultar()` traduce los errores.
import { cuentas } from '@finn/aplicacion/consultas/cuentas';
import { ordenarCuentas } from '../../servidor/acciones/cuentas';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { FormularioCuentasOrdenar } from './formulario';

export async function LectorCuentasOrdenar() {
  const dto = await consultar(async () => cuentas(await depsDeConsulta()));
  const grupos = [
    ['efectivo', dto.efectivo],
    ['tarjeta', dto.tarjetas],
    ['prestamo', dto.prestamos],
    ['inversion', dto.inversiones],
  ] as const;
  return (
    <FormularioCuentasOrdenar
      accion={ordenarCuentas}
      cuentas={grupos.flatMap(([tipo, xs]) =>
        xs.map((x) => ({ id: x.cuenta.id, nombre: x.cuenta.nombre, tipo })),
      )}
    />
  );
}

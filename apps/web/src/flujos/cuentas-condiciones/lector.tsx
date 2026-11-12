// Lector de `/cuentas/[cuentaId]/condiciones` (05 §2.7, §4.1): `formulario({ operacion: 'cuenta', cuentaId })`; `consultar()`
// traduce los errores. Préstamos (OP-48) y tarjetas (su edición); cualquier otra cuenta vuelve a su detalle.
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { notFound, redirect } from 'next/navigation';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { LectorCuentasEditar } from '../cuentas-editar/lector';
import { camposDe } from './campos';
import { FormularioCuentasCondiciones } from './formulario';

export async function LectorCuentasCondiciones({ cuentaId }: { readonly cuentaId: string }) {
  const dto = await consultar(
    async () => formulario(await depsDeConsulta(), { operacion: 'cuenta', cuentaId }),
    { validacionDeSegmento: true },
  );
  if (!('cuenta' in dto.contexto)) notFound(); // con `cuentaId` siempre viene; el tipo no lo sabe
  const cuenta: Readonly<Record<string, unknown>> = dto.contexto.cuenta;
  // CTA-01: las condiciones de una tarjeta (límite, tasa, corte y pago) se corrigen en su formulario de edición, sin redirigir.
  if (cuenta['tipo'] === 'tarjeta') return <LectorCuentasEditar cuentaId={cuentaId} />;
  if (cuenta['tipo'] !== 'prestamo') redirect(`/cuentas/${cuentaId}`);
  return <FormularioCuentasCondiciones prestamoId={cuentaId} visto={camposDe(cuenta)} />;
}

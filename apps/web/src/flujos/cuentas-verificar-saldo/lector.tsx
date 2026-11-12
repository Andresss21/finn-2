// Lector de `/cuentas/[cuentaId]/verificar-saldo` (05 §2.7): `formulario({ operacion: 'verificar_saldo', … })` con `?fecha=`. Los
// números vienen del servidor y aquí solo pasan al formulario (PF-3). Los errores de la consulta los traduce `consultar()`.
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { notFound } from 'next/navigation';
import { verificarSaldo } from '../../servidor/acciones/conciliacion';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { aParametrosDeConsulta, type BusquedaDePagina } from '../../servidor/parametros';
import { FormularioVerificarSaldo } from './formulario';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function LectorVerificarSaldo({
  cuentaId,
  busqueda,
  superpuesto = false,
}: {
  readonly cuentaId: string;
  readonly busqueda: BusquedaDePagina;
  readonly superpuesto?: boolean;
}) {
  if (!UUID.test(cuentaId)) notFound();
  const { fecha } = aParametrosDeConsulta(busqueda);
  const dto = await consultar(async () =>
    formulario(await depsDeConsulta(), {
      operacion: 'verificar_saldo',
      cuentaId,
      ...(typeof fecha === 'string' ? { fecha } : {}),
    }),
  );
  const { contexto: c } = dto;
  return (
    <FormularioVerificarSaldo
      accion={verificarSaldo}
      cuentaId={cuentaId}
      cuenta={c.cuenta.nombre}
      tarjeta={c.cuenta.tipo === 'tarjeta'}
      hoy={dto.hoy}
      fecha={c.fecha}
      cantidad={c.candidatas.cantidad}
      superpuesto={superpuesto}
      candidatas={c.candidatas.recientes.map((t) => ({
        id: t.id,
        comercio: t.comercio,
        fecha: t.fecha,
        monto: t.montoPresentado,
      }))}
    />
  );
}

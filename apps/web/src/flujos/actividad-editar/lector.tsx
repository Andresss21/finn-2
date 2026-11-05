// Lector de `/actividad/[transaccionId]/editar` (05 §2.6): llama a `formulario({ operacion: 'editar_transaccion', transaccionId })` y pasa al
// flujo la transacción con los catálogos. Las cuentas y categorías archivadas que ya usa vienen marcadas (04 §6.14.4). Lo único que
// traduce los errores de la consulta es `consultar()`.
import { rutaInterna } from '@finn/aplicacion/autenticacion';
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { mensajeDeRechazo } from '@finn/aplicacion/errores';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { editarTransaccion } from '../../servidor/acciones/transacciones';
import { formatearMonto } from '../../formato';
import { registrarGasto as g } from '../../textos/registrar-gasto';
import { transaccion as t } from '../../textos/transaccion';
import { camposIniciales } from './campos';
import { FormularioActividadEditar } from './formulario';

const nombre = (r: { readonly nombre: string; readonly archivada?: true }): string =>
  r.archivada === true ? t.archivada(r.nombre) : r.nombre;

export async function LectorActividadEditar({
  transaccionId,
  volver,
}: {
  readonly transaccionId: string;
  readonly volver: string | undefined;
}) {
  const dto = await consultar(
    async () =>
      formulario(await depsDeConsulta(), { operacion: 'editar_transaccion', transaccionId }),
    { validacionDeSegmento: true },
  );
  const c = dto.contexto;
  // El detalle del campo cerrado es del DTO tal cual: la deuda de la tarjeta o el saldo del efectivo; no se calcula nada.
  const cat = dto.catalogos.cuentas;
  const cuentas = [
    ...(cat?.efectivo ?? []).map((x) => ({
      id: x.cuenta.id,
      nombre: nombre(x.cuenta),
      tipo: 'efectivo' as const,
      detalle: g.saldoDeCuenta(formatearMonto(x.saldo)),
    })),
    ...(cat?.tarjetas ?? []).map((x) => ({
      id: x.cuenta.id,
      nombre: nombre(x.cuenta),
      tipo: 'tarjeta' as const,
      detalle: g.deudaDeCuenta(formatearMonto(x.deuda)),
    })),
    ...[...(cat?.prestamos ?? []), ...(cat?.inversiones ?? [])].map((x) => ({
      id: x.cuenta.id,
      nombre: nombre(x.cuenta),
      tipo: 'otra' as const,
    })),
  ];
  const categorias = (dto.catalogos.categorias?.grupos ?? []).flatMap((g) =>
    g.categorias.map((x) => ({ id: x.categoria.id, nombre: nombre(x.categoria) })),
  );
  const deudores = (dto.catalogos.deudores ?? []).map((x) => ({
    id: x.deudor.id,
    nombre: x.deudor.nombre,
  }));
  const archivada = c.cuentasArchivadas.length > 0;
  const volverA = volver === undefined ? undefined : rutaInterna(volver);
  return (
    <FormularioActividadEditar
      transaccionId={transaccionId}
      inicial={camposIniciales(c)}
      cuentas={cuentas}
      categorias={categorias}
      deudores={deudores}
      sinCuenta={c.efectos.length !== 1}
      soloEtiquetas={archivada}
      {...(c.restricciones.puedeCambiarCuenta
        ? {}
        : {
            motivoCuenta:
              mensajeDeRechazo({
                codigo: archivada ? 'cuenta_archivada' : 'cambio_cuenta_con_devoluciones',
                ...(archivada ? { datos: { cuenta: c.cuentasArchivadas[0]?.nombre ?? '' } } : {}),
              }) ?? '',
          })}
      detalle={`/actividad/${transaccionId}${volverA === undefined ? '' : `?volver=${encodeURIComponent(volverA)}`}`}
      accion={editarTransaccion}
    />
  );
}

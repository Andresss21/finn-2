// Lector de `/actividad/[transaccionId]/devolver` (05 §2.6, §4.1): llama a `formulario({ operacion: 'devolver', transaccionOriginalId })`
// y pasa al flujo las partes de la compra con su capacidad, las cuentas y las cifras de la compra, ya formateadas. Lo único que
// traduce los errores de la consulta es `consultar()`.
import { rutaInterna } from '@finn/aplicacion/autenticacion';
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { notFound } from 'next/navigation';
import { formatearMonto } from '../../formato';
import { devolver } from '../../servidor/acciones/eventos';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { transaccion as t } from '../../textos/transaccion';
import { FormularioActividadDevolver } from './formulario';

export async function LectorActividadDevolver({
  transaccionId,
  volver,
}: {
  readonly transaccionId: string;
  readonly volver: string | undefined;
}) {
  const dto = await consultar(
    async () =>
      formulario(await depsDeConsulta(), {
        operacion: 'devolver',
        transaccionOriginalId: transaccionId,
      }),
    { validacionDeSegmento: true },
  );
  const c = dto.contexto;
  // Con la compra pedida el contexto trae `compra` y `lineas`; sin ella, las candidatas (que aquí no se piden)
  if (!('compra' in c) || c.lineas === undefined) notFound();
  const { compra, lineas } = c;
  const volverA = volver === undefined ? undefined : rutaInterna(volver);
  const cuentas = [
    ...(dto.catalogos.cuentas?.efectivo ?? []).map((x) => ({
      ...x.cuenta,
      icono: 'wallet' as const,
    })),
    ...(dto.catalogos.cuentas?.tarjetas ?? []).map((x) => ({
      ...x.cuenta,
      icono: 'card' as const,
    })),
  ].map((x) => ({ valor: x.id, etiqueta: x.nombre, icono: x.icono }));
  return (
    <FormularioActividadDevolver
      accion={devolver}
      transaccionId={transaccionId}
      hoy={dto.hoy}
      cuentaDeLaCompra={compra.cuenta.id}
      cuentas={cuentas}
      partes={lineas.map((l) => ({
        lineaId: l.lineaId,
        nombre:
          l.destino.tipo === 'deudor' ? t.deudorPorCobrar(l.destino.nombre) : l.destino.nombre,
        queda: formatearMonto(l.capacidad),
        sinCapacidad: l.capacidad === 0,
      }))}
      resumen={{
        total: formatearMonto(compra.total),
        devuelto: formatearMonto(compra.devuelto),
        restante: formatearMonto(compra.restante),
      }}
      detalle={`/actividad/${transaccionId}${volverA === undefined ? '' : `?volver=${encodeURIComponent(volverA)}`}`}
    />
  );
}

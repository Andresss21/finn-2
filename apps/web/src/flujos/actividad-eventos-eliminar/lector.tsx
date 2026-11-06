// Lector de `/actividad/[transaccionId]/eventos/eliminar` (05 §2.6, §4.1, R2): llama a `detalleTransaccion({ transaccionId })`, busca
// entre los eventos de sus partes el que dicen `?tipo-evento=` y `?evento=` y pasa al flujo de eliminar su entrada de OP-34. Un
// evento que no es de la compra es `notFound()`. Lo único que traduce los errores es `consultar()`.
import { rutaInterna } from '@finn/aplicacion/autenticacion';
import { detalleTransaccion } from '@finn/aplicacion/consultas/detalle-transaccion';
import { notFound } from 'next/navigation';
import { eliminarEvento } from '../../servidor/acciones/eventos';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { dominio } from '../../textos/dominio';
import { transaccion as t } from '../../textos/transaccion';
import { FormularioActividadEliminar } from '../actividad-eliminar/formulario';

const TIPOS = ['cobro', 'condonacion', 'devolucion'] as const;

export async function LectorEventosEliminar({
  transaccionId,
  tipo,
  evento,
  volver,
}: {
  readonly transaccionId: string;
  readonly tipo: string | undefined;
  readonly evento: string | undefined;
  readonly volver: string | undefined;
}) {
  const dto = await consultar(
    async () => detalleTransaccion(await depsDeConsulta(), { transaccionId }),
    { validacionDeSegmento: true },
  );
  const elegido = TIPOS.find((x) => x === tipo);
  const ids = dto.lineas.flatMap((l) =>
    elegido === 'condonacion'
      ? l.condonaciones.map((e) => e.id)
      : (elegido === 'cobro' ? l.cobros : l.devoluciones).map((e) => e.transaccionId),
  );
  if (elegido === undefined || evento === undefined || !ids.includes(evento as never)) notFound();
  const volverA = volver === undefined ? undefined : rutaInterna(volver);
  return (
    <FormularioActividadEliminar
      accion={eliminarEvento}
      transaccionId={transaccionId}
      nombre={dto.transaccion.comercio ?? dominio.sinComercio}
      detalle={`/actividad/${transaccionId}${volverA === undefined ? '' : `?volver=${encodeURIComponent(volverA)}`}`}
      eventos={[]}
      textos={{
        titulo: t.eliminarEventoTitulo,
        pregunta: t.eliminarEventoPregunta[elegido],
        nota: t.eliminarEventoNota,
        confirmar: t.eliminarEvento,
      }}
      entrada={
        elegido === 'condonacion'
          ? { tipo: elegido, condonacionId: evento }
          : { tipo: elegido, transaccionId: evento }
      }
    />
  );
}

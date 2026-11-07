// Lector de `/cuentas/[cuentaId]/conciliar` (05 §2.7): `formulario({ operacion: 'conciliar', … })` para la cuenta. La clasificación
// no tiene consulta propia: es la salida de OP-45 y vive en el estado del componente (04 §6.12.6). Los errores de la consulta
// los traduce `consultar()`; una cuenta archivada o de otro tipo no abre el flujo (05 §7.7).
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { notFound } from 'next/navigation';
import {
  agregarDesdeEstado,
  iniciarConciliacion,
  terminarConciliacion,
} from '../../servidor/acciones/conciliacion';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { FormularioConciliar } from './formulario';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function LectorConciliar({ cuentaId }: { readonly cuentaId: string }) {
  if (!UUID.test(cuentaId)) notFound();
  const dto = await consultar(async () =>
    formulario(await depsDeConsulta(), { operacion: 'conciliar', cuentaId }),
  );
  const categorias = (dto.catalogos.categorias?.grupos ?? []).flatMap((g) =>
    g.categorias.map((x) => ({ id: x.categoria.id, nombre: x.categoria.nombre })),
  );
  return (
    <FormularioConciliar
      iniciar={iniciarConciliacion}
      terminar={terminarConciliacion}
      agregar={agregarDesdeEstado}
      categorias={categorias}
      tiposAlta={dto.contexto.tiposAlta}
      cuentaId={cuentaId}
      cuenta={dto.contexto.cuenta.cuenta.nombre}
    />
  );
}

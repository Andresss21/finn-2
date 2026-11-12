// Lector de `/metas/[metaId]` (05 §2.3, §4.1): `formulario({ operacion: 'meta', metaId })` con lo vigente de la meta (`esperado`).
// Una meta que no existe, o cuya categoría está archivada (se conserva sin evaluarse, B-11), no se abre: `notFound()`.
// Lo único que traduce los errores de la consulta es `consultar()` (CP-13).
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { notFound } from 'next/navigation';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { FormularioMetaEditar, type CampoConFoco } from './formulario';

export async function LectorMetasMeta({
  metaId,
  enfocar,
}: {
  readonly metaId: string;
  /** El campo que abre con el foco (E4-18). */
  readonly enfocar?: CampoConFoco | undefined;
}) {
  const dto = await consultar(
    async () => formulario(await depsDeConsulta(), { operacion: 'meta', metaId }),
    { validacionDeSegmento: true },
  );
  const { meta } = dto.contexto;
  if (meta === undefined) return notFound();
  const fecha = meta.esperado['fechaObjetivo'];
  return (
    <FormularioMetaEditar
      enfocar={enfocar}
      meta={{
        id: meta.id,
        categoria: meta.categoria.nombre,
        tipo: meta.tipo,
        ...(meta.modoMeta === undefined ? {} : { modoMeta: meta.modoMeta }),
        monto: meta.monto,
        fechaObjetivo: typeof fecha === 'string' ? fecha : null,
        vencida: meta.vencida,
      }}
    />
  );
}

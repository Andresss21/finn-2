// Lector de `/metas/[metaId]` (05 §2.3, §4.1): llama a `formulario({ operacion: 'meta', metaId })` y pasa la meta, con lo vigente
// de cada campo (`esperado`), al formulario. Una meta que no existe o cuya categoría está archivada (se conserva sin evaluarse,
// B-11) no se abre: es `notFound()`. Lo único que traduce los errores de la consulta es `consultar()` (CP-13).
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { notFound } from 'next/navigation';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { FormularioMeta } from './formulario';

export async function LectorMetasMeta({ metaId }: { readonly metaId: string }) {
  const dto = await consultar(
    async () => formulario(await depsDeConsulta(), { operacion: 'meta', metaId }),
    { validacionDeSegmento: true },
  );
  const { meta } = dto.contexto;
  if (meta === undefined) return notFound();
  const fecha = meta.esperado['fechaObjetivo'];
  return (
    <FormularioMeta
      categorias={[]}
      meta={{
        id: meta.id,
        categoria: meta.categoria.nombre,
        tipo: meta.tipo,
        ...(meta.modoMeta === undefined ? {} : { modoMeta: meta.modoMeta }),
        monto: meta.monto,
        fechaObjetivo: typeof fecha === 'string' ? fecha : null,
      }}
    />
  );
}

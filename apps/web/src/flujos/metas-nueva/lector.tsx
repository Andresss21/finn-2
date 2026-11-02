// Lector de `/metas/nueva` (05 §2.3, §4.1): llama a `formulario({ operacion: 'meta', categoriaId })` con el `?categoria=` de la URL
// y pasa las categorías sin meta al formulario. Una categoría que ya tiene meta lleva a su edición. Lo único que traduce los
// errores de la consulta es `consultar()` (CP-13).
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { redirect } from 'next/navigation';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import type { BusquedaDePagina } from '../../servidor/parametros';
import { metas as t } from '../../textos/metas';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { FormularioMeta } from './formulario';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function LectorMetasNueva({ busqueda }: { readonly busqueda: BusquedaDePagina }) {
  const crudo = busqueda['categoria'];
  const pedida = typeof crudo === 'string' && UUID.test(crudo) ? crudo : undefined;
  const dto = await consultar(
    async () =>
      formulario(await depsDeConsulta(), {
        operacion: 'meta',
        ...(pedida === undefined ? {} : { categoriaId: pedida }),
      }),
    { validacionDeSegmento: true },
  );
  const { meta, categoriasSinMeta } = dto.contexto;
  if (meta !== undefined) redirect(`/metas/${meta.id}`);
  if (categoriasSinMeta.length === 0)
    return (
      <main className="mx-auto flex max-w-xl flex-col gap-3 px-5 py-4">
        <h1 className="text-titulo-pantalla">{t.tituloNueva}</h1>
        <p>{t.sinCategorias}</p>
        <EnlaceFinn
          href="/metas"
          className="inline-flex min-h-11 items-center font-semibold underline"
        >
          {t.volver}
        </EnlaceFinn>
      </main>
    );
  return <FormularioMeta categorias={categoriasSinMeta} categoriaInicial={pedida} />;
}

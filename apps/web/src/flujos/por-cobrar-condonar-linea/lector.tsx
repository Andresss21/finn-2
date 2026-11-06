// Lector de `/por-cobrar/condonar/[lineaId]` (05 §2, §4.1): `formulario({ operacion: 'condonar', lineaId })`. Trae la línea con lo que
// queda abierto, la categoría propuesta (la de la misma compra, si está activa) y las categorías activas con su Disponible. Todo llega
// calculado por el servidor y aquí solo pasa a texto (PF-3). Lo único que traduce los errores de la consulta es `consultar()`.
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { centavosATextoDecimal, formatearMonto } from '../../formato';
import { condonar } from '../../servidor/acciones/eventos';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { FormularioCondonar } from './formulario';

export async function LectorCondonar({
  lineaId,
  superpuesto = false,
}: {
  readonly lineaId: string;
  readonly superpuesto?: boolean;
}) {
  const dto = await consultar(
    async () => formulario(await depsDeConsulta(), { operacion: 'condonar', lineaId }),
    { validacionDeSegmento: true },
  );
  const { linea, categoriaPropuesta } = dto.contexto;
  const categorias = (dto.catalogos.categorias?.grupos ?? []).flatMap((g) =>
    g.categorias.map((x) => ({
      id: x.categoria.id,
      nombre: x.categoria.nombre,
      disponible: formatearMonto(x.disponible),
    })),
  );
  return (
    <FormularioCondonar
      accion={condonar}
      lineaId={lineaId}
      deudor={linea.deudor.nombre}
      abierto={formatearMonto(linea.abierto)}
      montoInicial={centavosATextoDecimal(linea.abierto)}
      hoy={dto.hoy}
      categorias={categorias}
      categoriaPropuesta={categoriaPropuesta?.id}
      rutaPadre="/por-cobrar"
      superpuesto={superpuesto}
    />
  );
}

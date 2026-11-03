// Lector de `/bandeja/[movimientoId]` (05 §2.5): llama a `formulario({ operacion: 'movimiento', movimientoId })` y pasa al
// flujo el movimiento con el catálogo de categorías. Lo único que traduce los errores de la consulta es `consultar()`.
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { centavosATextoDecimal } from '../../formato';
import { FormularioMovimiento } from './formulario';

export async function LectorMovimiento({
  movimientoId,
  traspaso,
}: {
  readonly movimientoId: string;
  /** Viene de la fila de la lista, que no pudo aprobar con un toque (05 §4.15). */
  readonly traspaso: boolean;
}) {
  const dto = await consultar(async () =>
    formulario(await depsDeConsulta(), { operacion: 'movimiento', movimientoId }),
  );
  const m = dto.contexto.movimiento;
  const categorias = (dto.catalogos.categorias?.grupos ?? []).flatMap((g) =>
    g.categorias.map((x) => ({ id: x.categoria.id, nombre: x.categoria.nombre })),
  );
  const destino = m.lineas[0]?.destino;
  return (
    <FormularioMovimiento
      movimiento={{
        id: m.id,
        sms: m.sms.texto,
        comercio: m.comercio,
        montoTexto: m.monto === null ? null : centavosATextoDecimal(m.monto),
        tipo: m.tipoPropuesto,
        partes: m.lineas.length,
        categoriaId:
          destino !== undefined &&
          destino !== null &&
          'tipo' in destino &&
          destino.tipo === 'categoria'
            ? destino.id
            : null,
        ...(m.origenPropuesto === undefined ? {} : { origenId: m.origenPropuesto.id }),
        esperado: m.esperado,
      }}
      categorias={categorias}
      traspaso={traspaso}
    />
  );
}

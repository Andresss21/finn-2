// Lector de `/presupuesto/auto-asignar` (05 §2.3, §4.1): llama a `presupuesto({ periodoInicio })` con el `?periodo=` de la URL y
// pasa al formulario la revisión vista (`esperado.revision` de OP-17), los nombres de las categorías y si alguna meta tiene falta.
// Un período cerrado no se abre: redirige a Presupuesto con el motivo `periodo_cerrado` (inv. 18). Lo único que traduce los
// errores de la consulta es `consultar()` (CP-13).
import { presupuesto } from '@finn/aplicacion/consultas/presupuesto';
import type { FechaLocal } from '@finn/dominio/valores';
import { redirect } from 'next/navigation';
import { formatearMonto, formatearPeriodoNumerico } from '../../formato';
import { autoAsignar } from '../../servidor/acciones/presupuesto';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { aParametrosDeConsulta, type BusquedaDePagina } from '../../servidor/parametros';
import { FormularioAutoAsignar } from './formulario';

export interface PropsLectorAutoAsignar {
  readonly busqueda: BusquedaDePagina;
  readonly superpuesto?: boolean;
}

const texto = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);

export async function LectorAutoAsignar({ busqueda, superpuesto = false }: PropsLectorAutoAsignar) {
  const pedido = texto(aParametrosDeConsulta(busqueda)['periodoInicio']) as FechaLocal | undefined;
  const rutaPadre = pedido === undefined ? '/presupuesto' : `/presupuesto?periodo=${pedido}`;
  const dto = await consultar(async () =>
    presupuesto(await depsDeConsulta(), pedido === undefined ? {} : { periodoInicio: pedido }),
  );
  if (dto.periodo.estado === 'cerrado')
    redirect(`${rutaPadre}${pedido === undefined ? '?' : '&'}motivo=periodo_cerrado`);
  const filas = dto.grupos.flatMap((g) => g.categorias);
  return (
    <FormularioAutoAsignar
      accion={autoAsignar}
      periodoInicio={dto.periodo.inicio}
      revision={dto.revision}
      periodo={formatearPeriodoNumerico(dto.periodo)}
      lpa={formatearMonto(dto.lpa)}
      nombres={Object.fromEntries(filas.map((f) => [f.categoria.id, f.categoria.nombre]))}
      hayFalta={filas.some((f) => f.meta !== null && f.meta.falta > 0)}
      rutaPadre={rutaPadre}
      superpuesto={superpuesto}
    />
  );
}

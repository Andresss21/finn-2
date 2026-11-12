// Lector de `/presupuesto/mover` (05 §2.3, §4.1): llama a `formulario({ operacion: 'asignar' })` con `?categoria-origen=` o, si
// falta, `?categoria-destino=` (CP-10a) y el `?periodo=` de la URL, y pasa el catálogo con Asignado y Disponible al formulario.
// Un período cerrado no se abre: redirige a Presupuesto con el motivo `periodo_cerrado` (inv. 18). Lo único que traduce los
// errores de las consultas es `consultar()` (CP-13).
import { presupuesto } from '@finn/aplicacion/consultas/presupuesto';
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import type { FechaLocal } from '@finn/dominio/valores';
import { redirect } from 'next/navigation';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { aParametrosDeConsulta, type BusquedaDePagina } from '../../servidor/parametros';
import { detalleDeVolver, PARAMETRO_VOLVER } from '../presupuesto-asignar-categoria/resultado';
import { FormularioMover, type CategoriaParaMover } from './formulario';

export interface PropsLectorMover {
  readonly busqueda: BusquedaDePagina;
  readonly superpuesto?: boolean;
}

const texto = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);

export async function LectorMover({ busqueda, superpuesto = false }: PropsLectorMover) {
  const params = aParametrosDeConsulta(busqueda);
  const pedido = texto(params['periodoInicio']) as FechaLocal | undefined;
  const origenPedido = texto(params['categoriaOrigen']);
  const destinoPedido = texto(params['categoriaDestino']);
  // E2-13 [CH-248]: abierto desde el detalle de la categoría (`?volver=`), el resultado vuelve a él.
  const volver = detalleDeVolver(texto(busqueda[PARAMETRO_VOLVER]));
  const rutaPadre = pedido === undefined ? '/presupuesto' : `/presupuesto?periodo=${pedido}`;
  const vista = await consultar(async () =>
    presupuesto(await depsDeConsulta(), pedido === undefined ? {} : { periodoInicio: pedido }),
  );
  if (vista.periodo.estado === 'cerrado')
    redirect(`${rutaPadre}${pedido === undefined ? '?' : '&'}motivo=periodo_cerrado`);
  const primera = vista.grupos.flatMap((g) => g.categorias)[0]?.categoria.id;
  const categoriaId = origenPedido ?? destinoPedido ?? primera;
  if (categoriaId === undefined) redirect(rutaPadre);
  const dto = await consultar(
    async () =>
      formulario(await depsDeConsulta(), {
        operacion: 'asignar',
        categoriaId,
        ...(pedido === undefined ? {} : { periodoInicio: pedido }),
      }),
    { validacionDeSegmento: true },
  );
  const { contexto } = dto;
  const categorias: CategoriaParaMover[] = (dto.catalogos.categorias?.grupos ?? []).flatMap((g) =>
    g.categorias.map((x) => ({
      id: x.categoria.id,
      nombre: x.categoria.nombre,
      asignado: x.asignado ?? contexto.asignado,
      disponible: x.disponible,
    })),
  );
  // Un origen archivado no está en el catálogo, pero se puede sacar su dinero (equivale a OP-11): entra con lo del contexto.
  if (origenPedido !== undefined && !categorias.some((k) => k.id === origenPedido))
    categorias.unshift({
      id: origenPedido,
      nombre: contexto.categoria.nombre,
      asignado: contexto.asignado,
      disponible: contexto.disponible,
    });
  return (
    <FormularioMover
      periodoInicio={contexto.periodo}
      categorias={categorias}
      origenInicial={origenPedido ?? ''}
      destinoInicial={destinoPedido ?? ''}
      rutaPadre={rutaPadre}
      {...(volver === undefined ? {} : { rutaDetalle: volver })}
      superpuesto={superpuesto}
    />
  );
}

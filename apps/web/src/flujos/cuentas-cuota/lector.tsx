// Lector de `/cuentas/[cuentaId]/cuota` (05 §2.7): `formulario({ operacion: 'cuota_prestamo', … })` con `?modalidad=` y `?fecha=`.
// Los números vienen del servidor y aquí solo pasan a texto (PF-3). Los errores de la consulta los traduce `consultar()`.
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { notFound } from 'next/navigation';
import { centavosATextoDecimal } from '../../formato';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { aParametrosDeConsulta, type BusquedaDePagina } from '../../servidor/parametros';
import { modalidadDe, type Propuesta } from './campos';
import { FormularioCuentasCuota } from './formulario';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function LectorCuentasCuota({
  prestamoId,
  busqueda,
}: {
  readonly prestamoId: string;
  readonly busqueda: BusquedaDePagina;
}) {
  if (!UUID.test(prestamoId)) notFound();
  const { modalidad: pedida, fecha } = aParametrosDeConsulta(busqueda);
  const modalidad = modalidadDe(pedida);
  const dto = await consultar(async () =>
    formulario(await depsDeConsulta(), {
      operacion: 'cuota_prestamo',
      prestamoId,
      modalidad,
      ...(typeof fecha === 'string' ? { fecha } : {}),
    }),
  );
  const cuentas = dto.catalogos.cuentas;
  const origen = (tarjeta: boolean) => (x: { cuenta: { id: string; nombre: string } }) => ({
    ...x.cuenta,
    tarjeta,
  });
  const origenes = [
    ...(cuentas?.efectivo ?? []).map(origen(false)),
    ...(cuentas?.tarjetas ?? []).map(origen(true)),
  ];
  const categorias = (dto.catalogos.categorias?.grupos ?? []).flatMap((g) =>
    g.categorias.map((c) => ({
      id: c.categoria.id,
      nombre: c.categoria.nombre,
      grupo: g.grupo.nombre,
      disponible: c.disponible,
    })),
  );
  if (!('capitalPendiente' in dto.contexto)) notFound();
  const c = dto.contexto;
  const p = 'desglosePropuesto' in c ? c.desglosePropuesto : undefined;
  const propuesta: Propuesta | undefined =
    p === undefined
      ? undefined
      : {
          total: centavosATextoDecimal(p.total),
          capital: centavosATextoDecimal(p.capital),
          interes: centavosATextoDecimal(p.interes),
          seguro: centavosATextoDecimal(p.seguro),
          numeroCuota: p.numeroCuota,
        };
  const propuestaId = 'categoriaPropuesta' in c ? c.categoriaPropuesta.id : undefined;
  const categoriaPropuesta = categorias.some((x) => x.id === propuestaId) ? propuestaId : undefined;
  return (
    <FormularioCuentasCuota
      modalidad={modalidad}
      prestamoId={prestamoId}
      prestamoNombre={c.prestamo.nombre}
      hoy={dto.hoy}
      fecha={typeof fecha === 'string' ? fecha : dto.hoy}
      origenes={origenes}
      categorias={categorias}
      capitalPendiente={c.capitalPendiente}
      cuotaPactada={centavosATextoDecimal(c.cuotaPactada)}
      tieneModelo={c.tieneModelo}
      propuesta={propuesta}
      categoriaPropuesta={categoriaPropuesta}
    />
  );
}

// Lector de `/cuentas/[cuentaId]/cuota` (05 §2.7): llama a `formulario({ operacion: 'cuota_prestamo', prestamoId, modalidad, fecha })`
// con `?modalidad=` y `?fecha=` de la URL y pasa el contexto y los catálogos al formulario. Los números ya vienen del servidor: aquí
// solo se pasan a texto (PF-3). Lo único que traduce los errores de la consulta es `consultar()`.
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
  const modalidad = modalidadDe(aParametrosDeConsulta(busqueda)['modalidad']);
  const { fecha } = aParametrosDeConsulta(busqueda);
  const dto = await consultar(async () =>
    formulario(await depsDeConsulta(), {
      operacion: 'cuota_prestamo',
      prestamoId,
      modalidad,
      ...(typeof fecha === 'string' ? { fecha } : {}),
    }),
  );
  const cuentas = dto.catalogos.cuentas;
  const origenes = [
    ...(cuentas?.efectivo ?? []).map((x) => ({
      id: x.cuenta.id,
      nombre: x.cuenta.nombre,
      tarjeta: false,
    })),
    ...(cuentas?.tarjetas ?? []).map((x) => ({
      id: x.cuenta.id,
      nombre: x.cuenta.nombre,
      tarjeta: true,
    })),
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
      categoriaPropuesta={'categoriaPropuesta' in c ? c.categoriaPropuesta.id : undefined}
    />
  );
}

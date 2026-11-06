// Lector de `/por-cobrar/cobrar` (05 §2): `formulario({ operacion: 'cobrar', lineaId, deudorId, fecha })` con `?linea=`, `?deudor=`
// y `?fecha=`. Las partidas con saldo abierto, las cuentas, la propuesta AV-22 y las categorías de pago vienen del servidor y aquí
// solo pasan a texto (PF-3). Sin partidas abiertas a esa fecha el formulario no ofrece cobrar (06 FT-46, Estados).
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { notFound } from 'next/navigation';
import { centavosATextoDecimal, formatearMonto } from '../../formato';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import type { BusquedaDePagina } from '../../servidor/parametros';
import { dominio } from '../../textos/dominio';
import { porCobrarCobrar as t } from '../../textos/por-cobrar-cobrar';
import { FormularioPorCobrarCobrar } from './formulario';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const RUTA_PADRE = '/por-cobrar';

const texto = (v: string | readonly string[] | undefined): string | undefined =>
  typeof v === 'string' ? v : v?.[0];

export async function LectorPorCobrarCobrar({ busqueda }: { readonly busqueda: BusquedaDePagina }) {
  const linea = texto(busqueda['linea']);
  const deudor = texto(busqueda['deudor']);
  const fecha = texto(busqueda['fecha']);
  if (
    (linea !== undefined && !UUID.test(linea)) ||
    (deudor !== undefined && !UUID.test(deudor)) ||
    (fecha !== undefined && !FECHA.test(fecha))
  )
    notFound();
  const dto = await consultar(async () =>
    formulario(await depsDeConsulta(), {
      operacion: 'cobrar',
      ...(linea === undefined ? {} : { lineaId: linea }),
      ...(deudor === undefined ? {} : { deudorId: deudor }),
      ...(fecha === undefined ? {} : { fecha }),
    }),
  );
  const partidas = 'lineas' in dto.contexto ? dto.contexto.lineas : [];
  const pagos = dto.catalogos.categoriasPago ?? [];
  const pagoDe = (tarjetaId: string | undefined) =>
    tarjetaId === undefined ? undefined : pagos.find((p) => p.tarjeta.id === tarjetaId);
  const cuentas = dto.catalogos.cuentas;
  return (
    <FormularioPorCobrarCobrar
      hoy={dto.hoy}
      fecha={fecha ?? dto.hoy}
      rutaPadre={RUTA_PADRE}
      lineaInicial={
        partidas.find((p) => p.lineaId === linea)?.lineaId ?? partidas[0]?.lineaId ?? ''
      }
      partidas={partidas.map((p) => ({
        id: p.lineaId,
        deudor: p.deudor.nombre,
        comercio: p.comercio ?? dominio.sinComercio,
        abierto: formatearMonto(p.abierto),
        abiertoTexto: centavosATextoDecimal(p.abierto),
        tarjeta:
          p.propuestaAV22 && p.tarjeta !== undefined && pagoDe(p.tarjeta.id) !== undefined
            ? { id: p.tarjeta.id, nombre: p.tarjeta.nombre }
            : undefined,
        categoriaPagoId: pagoDe(p.tarjeta?.id)?.categoria.id,
      }))}
      cuentas={[
        ...(cuentas?.efectivo ?? []).map((x) => ({
          id: x.cuenta.id,
          nombre: x.cuenta.nombre,
          detalle: t.saldo(formatearMonto(x.saldo)),
          tarjeta: false,
          categoriaPagoId: undefined,
        })),
        ...(cuentas?.tarjetas ?? []).map((x) => ({
          id: x.cuenta.id,
          nombre: x.cuenta.nombre,
          detalle: t.deuda(formatearMonto(x.deuda)),
          tarjeta: true,
          categoriaPagoId: pagoDe(x.cuenta.id)?.categoria.id,
        })),
      ]}
    />
  );
}

// Lector de `/cuentas/[cuentaId]/pagar` (05 §2.7): `formulario({ operacion: 'pagar_tarjeta', tarjetaId })`. El desglose, la deuda, lo
// reservado y el origen propuesto vienen del servidor y aquí solo pasan a texto (PF-3). Una tarjeta archivada no se abre (05 §7.7).
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { notFound } from 'next/navigation';
import { PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { MENOS, centavosATextoDecimal, formatearMonto } from '../../formato';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { cuentasPagar as t } from '../../textos/cuentas-pagar';
import { FormularioCuentasPagar } from './formulario';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function LectorCuentasPagar({ tarjetaId }: { readonly tarjetaId: string }) {
  if (!UUID.test(tarjetaId)) notFound();
  const dto = await consultar(async () =>
    formulario(await depsDeConsulta(), { operacion: 'pagar_tarjeta', tarjetaId }),
  );
  const x = dto.contexto.tarjetas[0];
  if (x === undefined)
    return (
      <PaginaFlujoDeRuta titulo={t.tituloGenerico} rutaPadre={`/cuentas/${tarjetaId}`}>
        <p>{t.archivada}</p>
      </PaginaFlujoDeRuta>
    );
  const d = x.desgloseAlPagar;
  const propuesto = x.origenPropuesto?.id;
  const efectivo = dto.catalogos.cuentas?.efectivo ?? [];
  const origenes = efectivo.map((o) => ({
    id: o.cuenta.id,
    nombre: o.cuenta.nombre,
    detalle:
      o.cuenta.id === propuesto
        ? t.saldoPreseleccionada(formatearMonto(o.saldo))
        : t.saldo(formatearMonto(o.saldo)),
  }));
  const [, mes = '', dia = ''] = d.ultimoCorte.split('-');
  const nombre = x.tarjeta.nombre;
  const atajos = [
    { etiqueta: t.paraNoGenerarIntereses, centavos: d.paraNoGenerarIntereses },
    { etiqueta: t.todaLaDeuda, centavos: x.deuda },
    { etiqueta: t.loReservado, centavos: x.reservado },
  ]
    .filter((a) => a.centavos > 0)
    .map((a) => ({ etiqueta: a.etiqueta, valor: centavosATextoDecimal(a.centavos) }));
  const categoriaPago = dto.catalogos.categoriasPago?.find((c) => c.tarjeta.id === tarjetaId);
  return (
    <FormularioCuentasPagar
      tarjetaId={tarjetaId}
      tarjetaNombre={nombre}
      hoy={dto.hoy}
      deuda={formatearMonto(x.deuda)}
      origenes={origenes}
      origenPropuesto={origenes.some((o) => o.id === propuesto) ? propuesto : undefined}
      filas={[
        {
          clave: 'anterior',
          etiqueta: t.deudaAnterior(`${dia}/${mes}`),
          monto: formatearMonto(d.deudaAnterior),
        },
        { clave: 'cargos', etiqueta: t.cargosDelCiclo, monto: formatearMonto(d.cargosDelCiclo) },
        {
          clave: 'pagado',
          etiqueta: t.yaPagado,
          monto:
            d.yaPagado > 0 ? `${MENOS}${formatearMonto(d.yaPagado)}` : formatearMonto(d.yaPagado),
        },
        {
          clave: 'intereses',
          etiqueta: t.paraNoGenerarIntereses,
          monto: formatearMonto(d.paraNoGenerarIntereses),
        },
        {
          clave: 'reservado',
          etiqueta: t.reservadoPara(nombre),
          monto: formatearMonto(x.reservado),
        },
      ]}
      atajos={atajos}
      montoInicial={
        d.paraNoGenerarIntereses > 0 ? centavosATextoDecimal(d.paraNoGenerarIntereses) : ''
      }
      categoriaPagoId={categoriaPago?.categoria.id}
    />
  );
}

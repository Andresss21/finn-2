// `/por-cobrar/deudores/[deudorId]/cobrar` (05 §2 [CH-291], FT-46): «Cobrar varios», un pago del deudor repartido entre sus
// gastos abiertos (OP-31b). Es un flujo corto, como Cobrar. `formulario({ operacion: 'cobrar', deudorId })` trae sus líneas
// abiertas, ya de la más antigua a la más nueva, y el catálogo de deudores su total abierto: aquí solo pasan a texto (PF-3).
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FormularioCobrarVarios } from '../../../../../../flujos/por-cobrar-cobrar-varios/formulario';
import { centavosATextoDecimal, formatearFecha, formatearMonto } from '../../../../../../formato';
import { consultar } from '../../../../../../servidor/consultar';
import { depsDeConsulta } from '../../../../../../servidor/consultas';
import { dominio } from '../../../../../../textos/dominio';
import { porCobrarCobrar as t } from '../../../../../../textos/por-cobrar-cobrar';

export const metadata: Metadata = { title: t.tituloGenerico };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PaginaCobrarVarios({
  params,
}: {
  readonly params: Promise<{ readonly deudorId: string }>;
}) {
  const { deudorId } = await params;
  if (!UUID.test(deudorId)) notFound();
  const dto = await consultar(async () =>
    formulario(await depsDeConsulta(), { operacion: 'cobrar', deudorId }),
  );
  const lineas = 'lineas' in dto.contexto ? dto.contexto.lineas : [];
  const deudor = dto.catalogos.deudores?.find((d) => d.deudor.id === deudorId);
  const cuentas = dto.catalogos.cuentas;
  return (
    <FormularioCobrarVarios
      hoy={dto.hoy}
      rutaPadre="/por-cobrar"
      deudorId={deudorId}
      deudor={deudor?.deudor.nombre ?? ''}
      totalTexto={deudor === undefined ? '' : centavosATextoDecimal(deudor.abierto)}
      lineas={lineas.map((x) => ({
        id: x.lineaId,
        comercio: x.comercio ?? dominio.sinComercio,
        fecha: formatearFecha(x.fechaOrigen),
        abierto: formatearMonto(x.abierto),
        abiertoTexto: centavosATextoDecimal(x.abierto),
        tarjeta: x.propuestaAV22 ? x.tarjeta?.nombre : undefined,
      }))}
      cuentas={[
        ...(cuentas?.efectivo ?? []).map((x) => ({
          id: x.cuenta.id,
          nombre: x.cuenta.nombre,
          detalle: t.saldo(formatearMonto(x.saldo)),
          tarjeta: false,
        })),
        ...(cuentas?.tarjetas ?? []).map((x) => ({
          id: x.cuenta.id,
          nombre: x.cuenta.nombre,
          detalle: t.deuda(formatearMonto(x.deuda)),
          tarjeta: true,
        })),
      ]}
    />
  );
}

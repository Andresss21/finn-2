// «Cobrar varios» (05 §2 [CH-291], FT-46, OP-31b): las líneas abiertas del deudor, de la más antigua a la más nueva, y su
// total abierto vienen de `formulario` y aquí solo pasan a texto (PF-3). Sin gastos abiertos, «Esto ya no existe».
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FormularioCobrarVarios } from '../../../../../../flujos/por-cobrar-deudores-cobrar/formulario';
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
  if (lineas.length === 0 || deudor === undefined) notFound();
  const { efectivo = [], tarjetas = [] } = dto.catalogos.cuentas ?? {};
  return (
    <FormularioCobrarVarios
      hoy={dto.hoy}
      rutaPadre="/por-cobrar"
      deudorId={deudorId}
      deudor={deudor.deudor.nombre}
      totalTexto={centavosATextoDecimal(deudor.abierto)}
      lineas={lineas.map((x) => ({
        id: x.lineaId,
        comercio: x.comercio ?? dominio.sinComercio,
        fecha: formatearFecha(x.fechaOrigen),
        abierto: formatearMonto(x.abierto),
        abiertoTexto: centavosATextoDecimal(x.abierto),
      }))}
      cuentas={[
        ...efectivo.map(({ cuenta: k, saldo }) => ({
          ...{ id: k.id, nombre: k.nombre, tarjeta: false },
          detalle: t.saldo(formatearMonto(saldo)),
        })),
        ...tarjetas.map(({ cuenta: k, deuda }) => ({
          ...{ id: k.id, nombre: k.nombre, tarjeta: true },
          detalle: t.deuda(formatearMonto(deuda)),
        })),
      ]}
    />
  );
}

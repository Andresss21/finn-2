// Lector de `/programadas/[programadaId]/ocurrencias/[fechaEsperada]` (FT-41): `formulario({ operacion: 'programada', …, fechaEsperada })`
// (CP-10b). Una fecha que no es ocurrencia es `NO_ENCONTRADO`. Los números del servidor solo pasan a texto (PF-3).
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { mensajeDeRechazo } from '@finn/aplicacion/errores';
import { notFound } from 'next/navigation';
import { centavosATextoDecimal } from '../../formato';
import { omitirOcurrencia, registrarOcurrencia } from '../../servidor/acciones/programadas';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import type { Edicion } from './campos';
import { FormularioOcurrencia } from './formulario';

export async function LectorOcurrencia({
  programadaId,
  fechaEsperada,
  superpuesto = false,
}: {
  readonly programadaId: string;
  readonly fechaEsperada: string;
  readonly superpuesto?: boolean;
}) {
  const dto = await consultar(
    async () =>
      formulario(await depsDeConsulta(), { operacion: 'programada', programadaId, fechaEsperada }),
    { validacionDeSegmento: true },
  );
  const c = dto.contexto;
  if (!('ocurrencia' in c) || !('programada' in c)) notFound();
  const { programada: p, ocurrencia: o } = c;
  const partes = o.lineas.map((l) => ({
    categoriaId: l.categoria.id,
    categoria: l.categoria.nombre,
  }));
  const varias = p.tipo === 'gasto' && partes.length > 1;
  const edicion: Edicion = p.tipo === 'cuota_prestamo' ? 'cuota' : varias ? 'partes' : 'monto';
  const d = o.desglosePropuesto;
  return (
    <FormularioOcurrencia
      programadaId={programadaId}
      fechaEsperada={fechaEsperada}
      comercio={p.comercio}
      cuenta={o.cuenta.nombre}
      estado={o.estado}
      textoYaResuelta={mensajeDeRechazo({ codigo: 'ocurrencia_ya_resuelta' }) ?? ''}
      transaccionId={o.transaccionId ?? null}
      edicion={edicion}
      monto={centavosATextoDecimal(d?.total ?? o.monto)}
      partes={partes}
      montosDePartes={o.lineas.map((l) => centavosATextoDecimal(l.monto))}
      desglose={
        d === undefined
          ? null
          : {
              capital: centavosATextoDecimal(d.capital),
              interes: centavosATextoDecimal(d.interes),
              seguro: centavosATextoDecimal(d.seguro),
            }
      }
      superpuesto={superpuesto}
      accionRegistrar={registrarOcurrencia}
      accionOmitir={omitirOcurrencia}
    />
  );
}

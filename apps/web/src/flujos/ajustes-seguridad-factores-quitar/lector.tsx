// Lector de `/ajustes/seguridad/factores/[factorId]/quitar` (05 §2.11, CP-4): `estadoSeguridad()` dice si el factor existe y si es el
// único verificado. Un factor que ya no existe es `notFound()`, como un id desconocido en cualquier flujo. Con un solo factor
// verificado no hay flujo (AJU-15): se vuelve a Seguridad, donde el aviso lo explica.
import { notFound, redirect } from 'next/navigation';
import { quitarFactor } from '../../servidor/acciones/seguridad';
import { consultar } from '../../servidor/consultar';
import { estadoSeguridad } from '../../servidor/sesion';
import { formatearInstante } from '../../formato/instante-texto';
import { seguridad as t } from '../../textos/seguridad';
import { FormularioQuitarFactor } from './formulario';

const SIN_HORA = /^(\d{2}\/\d{2}\/\d{4})/;

export async function LectorQuitarFactor({
  factorId,
  superpuesto = false,
}: {
  readonly factorId: string;
  readonly superpuesto?: boolean;
}) {
  const { factores } = await consultar(() => estadoSeguridad());
  const factor = factores.find((f) => f.id === factorId);
  if (factor === undefined) return notFound();
  const otros = factores.filter((f) => f.estado === 'verificado' && f.id !== factorId);
  const esUnico = factor.estado === 'verificado' && otros.length === 0;
  if (esUnico) redirect('/ajustes/seguridad');
  const fecha = SIN_HORA.exec(formatearInstante(factor.creadoEn))?.[1] ?? '';
  return (
    <FormularioQuitarFactor
      accion={quitarFactor}
      factorId={factorId}
      nombre={factor.nombre ?? t.sinNombre}
      alta={t.alta(fecha)}
      quedan={otros.map((f) => f.nombre ?? t.sinNombre)}
      esUnico={false}
      superpuesto={superpuesto}
    />
  );
}

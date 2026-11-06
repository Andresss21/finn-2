// Lector de `/ajustes/seguridad/factores/[factorId]/quitar` (05 §2.11, CP-4): `estadoSeguridad()` dice si el factor existe y si es el
// único verificado. Un factor que ya no existe es `notFound()`, como un id desconocido en cualquier flujo.
import { notFound } from 'next/navigation';
import { quitarFactor } from '../../servidor/acciones/seguridad';
import { consultar } from '../../servidor/consultar';
import { estadoSeguridad } from '../../servidor/sesion';
import { FormularioQuitarFactor } from './formulario';

export async function LectorQuitarFactor({ factorId }: { readonly factorId: string }) {
  const { factores } = await consultar(() => estadoSeguridad());
  const factor = factores.find((f) => f.id === factorId);
  if (factor === undefined) return notFound();
  const verificados = factores.filter((f) => f.estado === 'verificado').length;
  return (
    <FormularioQuitarFactor
      accion={quitarFactor}
      factorId={factorId}
      nombre={factor.nombre ?? 'este factor'}
      esUnico={factor.estado === 'verificado' && verificados < 2}
    />
  );
}

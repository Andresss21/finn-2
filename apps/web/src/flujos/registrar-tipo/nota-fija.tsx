// [CH-240 E4-3] La nota fija de un flujo corto de Registrar: dice el efecto del tipo sin cifras y no cambia al escribir (PF-3, P6-27 a).
// Es una pieza aparte para que cada flujo la use igual y una prueba de componente la cubra sin montar las Server Actions.
import { registrarInversion as inv } from '../../textos/registrar-inversion';
import { registrarTarjeta as k } from '../../textos/registrar-tarjeta';
import { registrarTipo as t } from '../../textos/registrar-tipo';

export type ClaveDeNota = 'ingreso' | 'entrada-tarjeta' | 'retiro' | 'ajuste';

const TEXTOS: Readonly<Record<ClaveDeNota, string>> = {
  ingreso: t.notaIngreso,
  'entrada-tarjeta': k.notaEntrada,
  retiro: inv.notaRetiro,
  ajuste: inv.notaAjuste,
};

export function NotaFija({ clave }: { readonly clave: ClaveDeNota }) {
  return (
    <p data-rol="nota-fija" className="text-cuerpo-pequeno text-texto-secundario">
      {TEXTOS[clave]}
    </p>
  );
}

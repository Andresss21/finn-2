// Único componente que muestra un monto (05 §10.8, FE-45). El texto visible lleva U+2212 y queda fuera del árbol
// de accesibilidad; el lector oye "menos $X" (V5-25). Solo presenta: no calcula (PF-3).
import type { Centavos } from '@finn/dominio/valores';
import { formatearMonto, formatearMontoAccesible } from '../../formato';
import { COLOR_TEXTO, type EstadoFinanciero } from './indicador-estado';

const ROL = {
  'cifra-principal': 'text-cifra-principal',
  cifra: 'text-cifra',
  cuerpo: 'text-cuerpo',
} as const;

interface PropsMonto {
  readonly centavos: Centavos;
  readonly rol?: keyof typeof ROL;
  readonly estado?: EstadoFinanciero;
  /** `absoluto` muestra el valor sin signo (la fila ya dice si es salida o deuda). */
  readonly presentacion?: 'con-signo' | 'absoluto';
}

export function Monto({
  centavos,
  rol = 'cuerpo',
  estado,
  presentacion = 'con-signo',
}: PropsMonto) {
  const mostrado = presentacion === 'absoluto' ? (Math.abs(centavos) as Centavos) : centavos;
  const color = estado === undefined ? '' : COLOR_TEXTO[estado];
  return (
    <span
      data-centavos={centavos}
      className={['whitespace-nowrap tabular-nums', ROL[rol], color].join(' ')}
    >
      <span aria-hidden="true">{formatearMonto(mostrado)}</span>
      <span className="sr-only">{formatearMontoAccesible(mostrado)}</span>
    </span>
  );
}

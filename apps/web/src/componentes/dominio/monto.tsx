// Único componente que muestra un monto (05 §10.8, FE-45). El texto visible lleva U+2212 y queda fuera del árbol
// de accesibilidad; el lector oye "menos $X" (V5-25). Solo presenta: no calcula (PF-3).
import type { Centavos } from '@finn/dominio/valores';
import { formatearMonto, formatearMontoAccesible } from '../../formato';
import { Destello } from '../movimiento/destello';
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
  /**
   * `absoluto` muestra el valor sin signo (la fila ya dice si es salida o deuda); `salida` lo muestra siempre con el
   * signo menos, porque el tipo de la fila (un gasto, un consumo) dice que sale dinero, aunque el DTO traiga el valor positivo.
   */
  readonly presentacion?: 'con-signo' | 'absoluto' | 'salida';
  /** [CH-220 C3] Destella si el valor cambió desde el dibujo anterior (Disponible, pagos de tarjeta y totales). */
  readonly destello?: boolean;
}

export function Monto({
  centavos,
  rol = 'cuerpo',
  estado,
  presentacion = 'con-signo',
  destello = false,
}: PropsMonto) {
  const absoluto = Math.abs(centavos);
  const mostrado = (
    presentacion === 'absoluto' ? absoluto : presentacion === 'salida' ? -absoluto : centavos
  ) as Centavos;
  const color = estado === undefined ? '' : COLOR_TEXTO[estado];
  const monto = (
    <span
      data-centavos={centavos}
      className={['whitespace-nowrap tabular-nums', ROL[rol], color].join(' ')}
    >
      <span aria-hidden="true">{formatearMonto(mostrado)}</span>
      <span className="sr-only">{formatearMontoAccesible(mostrado)}</span>
    </span>
  );
  return destello ? <Destello valor={centavos}>{monto}</Destello> : monto;
}

// Prototipo de Monto (05 §10.8): texto visible formateado, texto accesible explícito y centavos para las pruebas.
import { formatearMonto } from '@/lib/formato';
export function Monto({ centavos, tamano = 'normal' }: { centavos: number; tamano?: 'normal' | 'grande' }) {
  const negativo = centavos < 0;
  const accesible = (negativo ? 'menos ' : '') + formatearMonto(Math.abs(centavos));
  return (
    <span data-centavos={centavos} className={`tabular-nums whitespace-nowrap ${tamano === 'grande' ? 'text-3xl font-semibold' : ''}`}>
      <span aria-hidden="true">{formatearMonto(centavos)}</span>
      <span className="sr-only">{accesible}</span>
    </span>
  );
}

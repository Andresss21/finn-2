// [CH-299] El resumen de AV-01 «después» (04 BE-38, 06-features CA-08.5) que se guarda en `notificaciones` y se ve en Inicio
// y en Notificaciones: frases legibles, sin «Δ» ni «LPA», sin líneas en cero. Solo da forma a los Δ que ya calculó el dominio
// (ADR-07): compara con cero y escribe el monto sin signo, no calcula.
import type { Impacto } from '@finn/dominio';
import type { Centavos } from '@finn/dominio/valores';
import { formatearMonto } from '../errores/formato.ts';

/** Si todo el impacto en el período activo es cero. */
export const SIN_CAMBIOS = 'No cambió nada en el período actual.';

/** `Listo para asignar bajó $30.00`; `null` si no cambió. */
const frase = (que: string, delta: Centavos): string | null =>
  delta === 0 ? null : `${que} ${delta > 0 ? 'subió' : 'bajó'} ${formatearMonto(delta, '')}`;

/** `Listo para asignar bajó $30.00 · Salidas bajó $20.00`: Listo para asignar, cada categoría, cada tarjeta y la reducción. */
export function resumenDelImpacto(
  impacto: Pick<
    Impacto,
    'deltaLpa' | 'deltaDisponible' | 'deltaTarjetas' | 'deltaReduccionProyectadaLpaAlCierre'
  >,
  nombres: Readonly<Record<string, string>>,
): string {
  const nombre = (id: string) => nombres[id] ?? '—';
  const frases = [
    frase('Listo para asignar', impacto.deltaLpa),
    ...impacto.deltaDisponible.map((x) => frase(nombre(x.categoriaId), x.delta)),
    ...impacto.deltaTarjetas.flatMap((t) => [
      frase(`Te falta reservar para ${nombre(t.tarjetaId)}`, t.deltaSaldo),
      frase(`Reservado de más en ${nombre(t.tarjetaId)}`, t.deltaReserva),
    ]),
    frase(
      'La reducción proyectada de Listo para asignar al cierre',
      impacto.deltaReduccionProyectadaLpaAlCierre,
    ),
  ].filter((f): f is string => f !== null);
  return frases.length === 0 ? SIN_CAMBIOS : frases.join(' · ');
}

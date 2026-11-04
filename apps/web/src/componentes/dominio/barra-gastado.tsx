// Barra de gastado sobre asignado (06-identidad-visual 2.5, CF-25). Dibuja los puntos básicos que trae el DTO tal
// cual: no calcula proporciones (PF-3). Es decorativa: el texto de la fila lleva la información.
export interface BarraDto {
  readonly cubiertoBp: number;
  readonly excedenteBp: number;
  readonly tipoExcedente: 'debito' | 'tarjeta' | 'mixto' | null;
  readonly metaBp?: number;
}

interface PropsBarra {
  readonly barra: BarraDto | null;
  /** Meta cubierta (la fila lo sabe por el DTO): lo gastado se pinta en `--positivo-borde` (06 2.5). */
  readonly metaCubierta?: boolean;
}

const EXCEDENTE = {
  debito: 'bg-problema-borde',
  // 06 2.5: el excedente con tarjeta es sólido (el rayado es del uso del límite de la tarjeta).
  tarjeta: 'bg-deuda-sin-respaldo-borde',
  // Mixto: franja superior de débito y franja inferior de tarjeta, distinguibles sin color.
  mixto:
    'bg-[linear-gradient(var(--problema-borde)_0_50%,var(--deuda-sin-respaldo-borde)_50%_100%)]',
} as const;

// Conversión de unidad: puntos básicos a porcentaje de ancho (no es aritmética de montos).
const ancho = (bp: number) => ({ width: `${bp / 100}%` });

export function BarraGastado({ barra, metaCubierta = false }: PropsBarra) {
  if (barra === null) return null;
  const { cubiertoBp, excedenteBp, tipoExcedente, metaBp } = barra;
  return (
    <div
      aria-hidden="true"
      data-barra={tipoExcedente ?? 'dentro'}
      className="flex h-1.5 gap-0.5 overflow-hidden rounded-pastilla bg-superficie-hundida"
    >
      {cubiertoBp > 0 ? (
        <span
          data-segmento="cubierto"
          style={ancho(cubiertoBp)}
          className={metaCubierta ? 'bg-positivo-borde' : 'bg-texto-secundario'}
        />
      ) : null}
      {excedenteBp > 0 && tipoExcedente !== null ? (
        <span
          data-segmento="excedente"
          style={ancho(excedenteBp)}
          className={EXCEDENTE[tipoExcedente]}
        />
      ) : null}
      {metaBp !== undefined && metaBp > 0 ? (
        <span data-segmento="meta" style={ancho(metaBp)} className="bg-positivo-borde" />
      ) : null}
    </div>
  );
}

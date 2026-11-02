// Los días de un período puestos en la semana, para dibujar un calendario (FT-14, 06-identidad-visual §6). Solo ordena fechas:
// no decide qué período es ni toca montos (05 §3.4, PF-3). `Date` vive acá, en `src/formato/` (L7).

export interface DiaDeCalendario {
  /** `AAAA-MM-DD` */
  readonly fecha: string;
  /** Lugar en la semana, con el lunes en 0. */
  readonly columna: number;
}

/** Los `dias` días que empiezan en `inicio` (`AAAA-MM-DD`), cada uno con su columna de lunes a domingo. */
export function diasDelCalendario(inicio: string, dias: number): DiaDeCalendario[] {
  const [anio = 0, mes = 1, dia = 1] = inicio.split('-').map(Number);
  return Array.from({ length: dias }, (_, k) => {
    const d = new Date(Date.UTC(anio, mes - 1, dia + k));
    return {
      fecha: d.toISOString().slice(0, 10),
      columna: (d.getUTCDay() + 6) % 7,
    };
  });
}

// Único archivo del cliente, con `src/formato/`, que usa `Date` (L7, 05 §4.11). Aquí solo el instante del borrador; la
// agenda de la medianoche (6.7) se suma en su tarea.

/** El instante actual en ISO 8601 (UTC), solo para marcar cuándo se guardó un borrador. */
export const instanteActual = (): string => new Date().toISOString();

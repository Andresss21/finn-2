// El instante actual del cliente (L7: `Date` solo en `src/formato/`). Solo marca cuándo se guardó un borrador (05 §4.11).

/** El instante actual en ISO 8601 (UTC). */
export const instanteActual = (): string => new Date().toISOString();

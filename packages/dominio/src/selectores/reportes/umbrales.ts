// Umbrales de los reportes accionables (06 §3.5.3, FD-18): el único lugar donde se definen. Los
// porcentajes van como [numerador, denominador] para aplicarlos con la proporción de `Centavos`.
import { Centavos } from '../../valores/centavos';

const usd = (dolares: number) => Centavos.desdeEntero(dolares * 100);

export const DIAS_MIN_RITMO = 7;
export const CONSUMOS_MIN_RITMO = 3;
export const EXCESO_MIN = usd(5);
export const EXCESO_MIN_PCT = [5, 100] as const;
export const RITMO_INICIO_MAX = 3;
export const REAL_TOL_MIN = usd(10);
export const REAL_TOL_PCT = [10, 100] as const;
export const PROM_VAR_MIN = usd(20);
export const PROM_VAR_PCT = [25, 100] as const;
export const HORMIGA_MONTO_MAX = usd(10);
export const HORMIGA_CANT_MIN = 5;
export const HORMIGA_TOTAL_MIN = usd(20);
/** Períodos cerrados que mira la detección de suscripciones y cuántos deben traer el cobro. */
export const SUSC_PERIODOS = 4;
export const SUSC_PERIODOS_MIN = 3;
export const SUSC_MONTO_PCT = [10, 100] as const;
export const SUSC_DIAS = 5;

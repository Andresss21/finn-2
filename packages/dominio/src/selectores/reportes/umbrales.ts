// Umbrales de los reportes accionables (06 §3.5.3, FD-18): el único lugar donde se definen. Los
// porcentajes van como [numerador, denominador] para aplicarlos con la proporción de `Centavos`.
import { Centavos } from '../../valores/centavos';

const usd = (dolares: number) => Centavos.desdeEntero(dolares * 100);

export const DIAS_MIN_RITMO = 7;
export const CONSUMOS_MIN_RITMO = 3;
export const EXCESO_MIN = usd(5);
export const EXCESO_MIN_PCT = [5, 100] as const;
export const RITMO_INICIO_MAX = 3;

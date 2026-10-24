// Regla de P7-10 (lista de permitidos), sin E/S, compartida por las barreras 1 y 2 de CT-01.
// El reloj de prueba solo se permite si FINN_ENTORNO === 'pruebas' y VERCEL_ENV NO está definida (con cualquier valor).
const VARIABLES_RELOJ = ['FINN_RELOJ_ARCHIVO', 'FINN_HOY_SIMULADO'] as const;
export function relojPermitido(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.FINN_ENTORNO === 'pruebas' && !Object.prototype.hasOwnProperty.call(env, 'VERCEL_ENV');
}
export function hayVariableDeReloj(env: NodeJS.ProcessEnv = process.env): boolean {
  return VARIABLES_RELOJ.some((v) => Object.prototype.hasOwnProperty.call(env, v)); // existe, aunque esté vacía
}

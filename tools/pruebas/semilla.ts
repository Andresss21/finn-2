// Semilla de la corrida (07 §7.1): FC_SEED = número de corrida de CI; una sola fuente para
// fast-check y para el orden aleatorio de Vitest. Solo sintaxis que Node 24 borra sin transformar.
export interface Entorno {
  readonly [clave: string]: string | undefined;
}

function entero(valor: string | undefined): number | undefined {
  if (valor === undefined || !/^\d{1,9}$/.test(valor)) return undefined;
  return Number(valor);
}

/** FC_SEED explícita, si no el número de corrida de CI, si no una semilla nueva (impresa para reproducir). */
export function resolverSemilla(env: Entorno, alAzar: () => number): number {
  return (
    entero(env['FC_SEED']) ??
    entero(env['GITHUB_RUN_NUMBER']) ??
    Math.floor(alAzar() * 1_000_000_000)
  );
}

/** Fija FC_SEED en el entorno del proceso para que los hijos y fast-check usen la misma. */
export function fijarSemilla(env: Record<string, string | undefined> = process.env): number {
  const semilla = resolverSemilla(env, Math.random);
  env['FC_SEED'] = String(semilla);
  return semilla;
}

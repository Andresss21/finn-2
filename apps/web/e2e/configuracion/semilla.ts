// `sembrar(estado)` (TA-219; DP-17, 07 §12.4): corre en el proceso de Playwright, antes de abrir el navegador, con el
// ejecutor `int`: solo operaciones reales de @finn/aplicacion, así la base solo tiene estados alcanzables. Deja el
// resultado en finn_e2e, la base a la que está conectada la app; el pool del servidor se reconecta solo.
import { ejecutorInt } from '../../../../packages/aplicacion/test/escenarios/int.ts';
import { consultar, urlDe } from '../../../../packages/db/test/ayudantes/conexion.ts';
import type { Escenario } from '../../../../packages/dominio/escenarios/tipos';

const BASE_E2E = 'finn_e2e';

/** Corre el estado inicial de una semilla (`packages/dominio/escenarios/semillas/`) y la deja como base de la app. */
export async function sembrar(estado: Escenario, hoy: string): Promise<void> {
  const s = await ejecutorInt.iniciar(estado, hoy);
  await s.cliente.$disconnect(); // CREATE DATABASE … TEMPLATE exige que nadie esté conectado a la fuente
  const admin = urlDe('postgres', 'admin');
  await consultar(admin, `DROP DATABASE IF EXISTS ${BASE_E2E} WITH (FORCE)`);
  await consultar(admin, `CREATE DATABASE ${BASE_E2E} TEMPLATE ${s.base.nombre}`);
  await consultar(admin, `ALTER DATABASE ${BASE_E2E} SET finn.reloj_simulado = on`);
  await ejecutorInt.terminar(s);
}

// tools/respaldo/motor.ts — paso 9 de la prueba de restauración (03 §12.2; 04 §16.4; ADR-22, decisión 4).
// Uso: node tools/respaldo/motor.ts <URL de la base restaurada> <hoy AAAA-MM-DD, la fecha del volcado>
// Carga los hechos restaurados con `cargarHechos` de @finn/db (el mismo de la app, 04 §5.2), calcula con
// `calcular(hechos, hoy)` y verifica los invariantes de 01 §6 con `verificarInvariantes` de @finn/dominio.
// Sale con 1 si hay violaciones; imprime solo cuántas hay por invariante, nunca filas ni montos (el log del job).
// Node 24 corre este archivo sin transformar; el código de los paquetes importa sin extensión, así que antes de
// cargarlo se registra un resolvedor que prueba `.ts` e `/index.ts`.
import { registerHooks } from 'node:module';

registerHooks({
  resolve(especificador, contexto, siguiente) {
    try {
      return siguiente(especificador, contexto);
    } catch (e) {
      const relativo = especificador.startsWith('.');
      if (!relativo || (e as { code?: string }).code !== 'ERR_MODULE_NOT_FOUND') throw e;
      for (const sufijo of ['.ts', '/index.ts'])
        try {
          return siguiente(especificador + sufijo, contexto);
        } catch {
          // probar el siguiente sufijo
        }
      throw e;
    }
  },
});

const [url = '', hoyTexto = ''] = process.argv.slice(2);
if (!url || !hoyTexto) {
  console.error('uso: node tools/respaldo/motor.ts <URL> <hoy AAAA-MM-DD>');
  process.exit(2);
}
process.env['DATABASE_URL'] = url;
const db = await import('../../packages/db/src/index.ts');
const dominio = await import('../../packages/dominio/src/index.ts');
const { FechaLocal } = await import('../../packages/dominio/src/valores/index.ts');

const hoy = FechaLocal.desdeTexto(hoyTexto);
const hechos = await db.leer((tx) => db.cargarHechos(tx));
const violaciones = dominio.verificarInvariantes(dominio.calcular(hechos, hoy));
const filas = Object.values(hechos).reduce((n, t: readonly unknown[]) => n + t.length, 0);
const porInvariante = new Map<number, number>();
for (const v of violaciones)
  porInvariante.set(v.invariante, (porInvariante.get(v.invariante) ?? 0) + 1);
for (const [n, cuantas] of porInvariante) console.log(`   inv. ${n}: ${cuantas} violaciones`);
console.log(
  `   ${filas} filas del motor, ${violaciones.length} violaciones de invariantes (hoy ${hoy})`,
);
process.exit(violaciones.length > 0 ? 1 : 0);

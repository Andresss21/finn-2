// Arnés de prueba (V7-02): `prisma migrate diff --from-url --to-schema --exit-code` con el motor
// WASM de Prisma 7.10 y @prisma/adapter-pg (el motor nativo no se puede descargar en este entorno).
// Uso: node arnes/diff.mjs <url> <schema.prisma>   → imprime el SQL del diff y sale con 0 (vacío) o 2.
import { readFileSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import * as wasm from '@prisma/schema-engine-wasm';
const [url, schemaPath] = process.argv.slice(2);
const f = new PrismaPg({ connectionString: url });
const envolver = (a) => { const ci = a.getConnectionInfo.bind(a); a.getConnectionInfo = () => ({ ...ci(), schemaName: 'finn', maxBindValues: 32766 }); const qr = a.queryRaw.bind(a); a.queryRaw = async (q) => { const r = await qr(q); if (process.env.DBG) console.error('Q', q.sql.slice(0, 70).replace(/\s+/g, ' '), '| tipos', JSON.stringify(r.columnTypes), '| filas', r.rows.length, '| f0', JSON.stringify(r.rows[0])?.slice(0, 160)); r.columnTypes = r.columnTypes.map(t => t ?? 7); return r; }; return a; };
const fabrica = { provider: f.provider, adapterName: f.adapterName,
  connect: async () => envolver(await f.connect()), connectToShadowDb: async () => envolver(await f.connectToShadowDb()) };
const content = readFileSync(schemaPath, 'utf8');
const eng = await wasm.SchemaEngine.new({ datamodels: [[schemaPath, content]] }, () => {}, fabrica);
const r = await eng.diff({ from: { tag: 'url', url }, to: { tag: 'schemaDatamodel', files: [{ path: schemaPath, content }] }, script: true, exitCode: true, filters: { externalTables: [], externalEnums: [] } });
console.log((r.stdout ?? '').trim() || '(diff vacío)'); console.log('exitCode', r.exitCode);
process.exit(r.exitCode);

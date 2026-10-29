// tools/respaldo/test/pg-docker.mjs — solo para PRU-RES-RESP-101: corre pg_dump, pg_restore y psql dentro del
// contenedor de destino, que tiene el cliente de la misma versión mayor que el servidor (04 §16.2). Los scripts lo
// usan con FINN_PG_EXEC="node tools/respaldo/test/pg-docker.mjs"; en el runner de producción esa variable no existe
// y llaman al cliente instalado.
// Uso: node pg-docker.mjs <pg_dump|pg_restore|psql> <argumentos…>
// - Los archivos viajan por stdin y stdout: `pg_dump --file X` escribe X; `psql -f X` y `pg_restore X` lo leen.
// - Una URL hacia el puerto del destino pasa a localhost:5432; cualquier otro puerto publicado del anfitrión (la
//   base de origen) se alcanza como host.docker.internal.
import { spawnSync } from 'node:child_process';
import { closeSync, existsSync, openSync } from 'node:fs';

const [herramienta = '', ...args] = process.argv.slice(2);
const { FINN_PG_CONTENEDOR: contenedor, FINN_PG_DESTINO_PUERTO: destino } = process.env;
if (!contenedor || !['pg_dump', 'pg_restore', 'psql'].includes(herramienta)) {
  console.error(
    'pg-docker: falta FINN_PG_CONTENEDOR o la herramienta no es pg_dump, pg_restore ni psql',
  );
  process.exit(2);
}

const url = (a) =>
  a.replace(/@(localhost|127\.0\.0\.1):(\d+)\//g, (_, _h, p) =>
    p === destino ? '@localhost:5432/' : `@host.docker.internal:${p}/`,
  );
let [entrada, salida] = [null, null];
const fuera = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (herramienta === 'pg_dump' && (a === '--file' || a === '-f')) salida = args[++i];
  else if (herramienta === 'psql' && (a === '-f' || a === '--file')) {
    entrada = args[++i];
    fuera.push('-f', '-');
  } else if (herramienta === 'pg_restore' && !a.startsWith('-') && existsSync(a)) entrada = a;
  else fuera.push(url(a));
}

const fd = [
  entrada ? openSync(entrada, 'r') : 'ignore',
  salida ? openSync(salida, 'w') : 'inherit',
];
// PGUSER y PGPASSWORD pasan del entorno; dentro del contenedor el destino es localhost:5432
const r = spawnSync(
  'docker',
  [
    'exec',
    ...(entrada ? ['-i'] : []),
    ...['-e', 'PGHOST=localhost', '-e', 'PGPORT=5432', '-e', 'PGUSER', '-e', 'PGPASSWORD'],
    contenedor,
    herramienta,
    ...fuera,
  ],
  { stdio: [fd[0], fd[1], 'inherit'] },
);
for (const f of fd) if (typeof f === 'number') closeSync(f);
process.exit(r.status ?? 1);

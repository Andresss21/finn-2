#!/bin/bash
set +x
# tools/humo/humo.sh — prueba de humo de infraestructura (04 §17; P4-17). La ejecuta el usuario (08 TU-07) en una
# ventana de Git Bash suya, antes de cargar datos reales. Bash, psql, pg_dump, Node 24, Docker y la CLI de Prisma 7.
# Uso: bash tools/humo/humo.sh | tee /c/finn/humo.jsonl
# Entradas, solo por variables de la sesión (04 §17.1):
#   HUMO_ADMIN_URL (secreta; rol postgres), HUMO_REF, HUMO_POOLER_HOST, SUPABASE_URL; SUPABASE_SERVICE_ROLE (H-10)
#   y VERCEL_TOKEN (H-09), ambas secretas y de TA-253.
# Opcionales, fuera de 04 §17.1 (CH-38):
#   HUMO_CLAVE_PUBLICA     la clave pública de la API, para H-11 (sin ella H-11 falla: no probaría nada)
#   HUMO_CLAVE_MIGRACIONES, HUMO_CLAVE_APP, HUMO_CLAVE_RESPALDO: secretas, las del bootstrap (H-02); si faltan, se
#                          generan para esta ejecución, y después se rotan con tools/db/bootstrap.sql
#   HUMO_CLAVE_DESTINO     secreta, la del PostgreSQL local de restauración (H-08); si falta, se genera
#   HUMO_PUERTO_TX, HUMO_PUERTO_SESION: los puertos del pooler (6543 y 5432)
#   HUMO_PASOS             solo esos pasos, p. ej. "H-01 H-07"
# Salida: una línea JSON por paso, { paso, resultado: pasa | falla | omitido, medido, detalle }. Todo lo que un paso
# escribe (también los errores de psql, Prisma o Docker) pasa por el filtro de `emitir`, que tapa con *** el valor
# de cada variable secreta y la contraseña de cualquier URL. Nada más llega a la terminal. Nunca `set -x`.
# Cada paso es un script de tools/humo/pasos/ que corre aparte: un fallo no detiene los siguientes. El script de un
# paso escribe `medido <clave> <valor>` y `detalle <texto>`, y sale con 0 (pasa), 1 (falla) o 3 (omitido).
set -uo pipefail
RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$RAIZ" || exit 1

clave() { openssl rand -hex 16; }
export HUMO_CLAVE_MIGRACIONES="${HUMO_CLAVE_MIGRACIONES:-$(clave)}"
export HUMO_CLAVE_APP="${HUMO_CLAVE_APP:-$(clave)}"
export HUMO_CLAVE_RESPALDO="${HUMO_CLAVE_RESPALDO:-$(clave)}"
export HUMO_CLAVE_DESTINO="${HUMO_CLAVE_DESTINO:-$(clave)}"
export HUMO_PUERTO_TX="${HUMO_PUERTO_TX:-6543}" HUMO_PUERTO_SESION="${HUMO_PUERTO_SESION:-5432}"
export HUMO_REF="${HUMO_REF:-}" HUMO_POOLER_HOST="${HUMO_POOLER_HOST:-}"

# El filtro y la línea JSON. Los secretos llegan por el entorno, nunca por argumentos ni por la salida.
EMITIR='
const fs = require("node:fs");
const e = process.env;
const nombres = ["HUMO_ADMIN_URL", "SUPABASE_SERVICE_ROLE", "VERCEL_TOKEN", "HUMO_CLAVE_MIGRACIONES",
  "HUMO_CLAVE_APP", "HUMO_CLAVE_RESPALDO", "HUMO_CLAVE_DESTINO", "HUMO_CLAVE_PUBLICA"];
const secretos = new Set();
for (const n of nombres) {
  const v = e[n] ?? "";
  if (v.length < 4) continue;
  secretos.add(v);
  try { secretos.add(encodeURIComponent(v)); } catch {}
  try {
    const u = new URL(v);
    for (const p of [u.password]) if (p.length >= 4) {
      secretos.add(p); try { secretos.add(decodeURIComponent(p)); } catch {}
    }
  } catch {}
}
const lista = [...secretos].sort((a, b) => b.length - a.length);
const tapar = (t) => {
  let s = String(t);
  for (const v of lista) s = s.split(v).join("***");
  return s.replace(/(\/\/[^:@\/\s]*):[^@\/\s]*@/g, "$1:***@");
};
const texto = fs.readFileSync(0, "utf8");
const medido = { ms: Number(e.HUMO_MS) };
const detalles = [];
const otras = [];
for (const l of texto.split(/\r?\n/)) {
  const m = /^medido (\S+) ?(.*)$/.exec(l);
  const d = /^detalle (.*)$/.exec(l);
  if (m) medido[tapar(m[1])] = tapar(m[2]);
  else if (d) detalles.push(tapar(d[1]));
  else if (l.trim() !== "") otras.push(tapar(l.trim()));
}
const resultado = { 0: "pasa", 3: "omitido" }[e.HUMO_CODIGO] ?? "falla";
if (resultado === "falla" && otras.length) detalles.push(otras.slice(-4).join(" | "));
const detalle = detalles.join("; ").slice(0, 1500);
console.log(JSON.stringify({ paso: e.HUMO_PASO, resultado, medido, detalle }));
'

FALLAS=0
# emitir <paso> <código> <ms>: lee la salida del paso por stdin
emitir() { HUMO_PASO="$1" HUMO_CODIGO="$2" HUMO_MS="$3" node -e "$EMITIR"; }
microsegundos() { local t=${EPOCHREALTIME/[.,]/}; echo "$t"; }

paso() {
  local id=$1 script=$2 inicio fin salida codigo
  if [ -n "${HUMO_PASOS:-}" ] && [[ " $HUMO_PASOS " != *" $id "* ]]; then return; fi
  if [ "$script" = "-" ]; then
    printf 'detalle %s\n' "$3" | emitir "$id" 3 0
    return
  fi
  inicio=$(microsegundos)
  salida=$(bash "$RAIZ/tools/humo/pasos/$script" "$id" </dev/null 2>&1)
  codigo=$?
  fin=$(microsegundos)
  [ "$codigo" = 0 ] || [ "$codigo" = 3 ] || FALLAS=$((FALLAS + 1))
  printf '%s\n' "$salida" | emitir "$id" "$codigo" $(((fin - inicio) / 1000))
}

paso H-01 base.sh
paso H-02 base.sh
paso H-03 base.sh
paso H-04 base.sh
paso H-05 h05-migraciones.sh
paso H-06 base.sh
paso H-07 base.sh
paso H-08 h08-respaldo.sh
paso H-09 - 'omitido hasta TA-253: carga del motor desde iad1 (BE-58)'
paso H-10 - 'omitido hasta TA-253: Auth, claves asimétricas, TOTP y recuperación'
paso H-11 base.sh
paso H-12 base.sh
[ "$FALLAS" = 0 ]

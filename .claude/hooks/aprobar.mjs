// .claude/hooks/aprobar.mjs — registra tu aprobación de una tarea de revisión obligatoria (DT-33).
// Lo ejecuta el hook UserPromptSubmit de Claude Code con cada mensaje que VOS enviás en la sesión.
// Si el mensaje es "mergeá TA-nnn" (o "mergea TA-nnn"), escribe C:/finn/_aprobaciones/TA-nnn.json con la hora y una
// huella del mensaje. `pnpm pr:mergear <n> --aprobado` exige ese archivo, más nuevo que el último commit del PR, y lo borra.
// Los agentes no pueden escribir en esa carpeta (deny en settings.json); este script no lo ejecuta un agente.
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

let entrada = '';
try { entrada = readFileSync(0, 'utf8'); } catch { process.exit(0); }
let datos = {};
try { datos = JSON.parse(entrada); } catch { process.exit(0); }
const texto = String(datos.prompt ?? '');
const m = /^\s*merge[áa]\s+(TA-\d{3})\s*\.?\s*$/i.exec(texto);
if (!m) process.exit(0);
const tarea = m[1].toUpperCase();
const dir = 'C:/finn/_aprobaciones';
mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}/${tarea}.json`, JSON.stringify({
  tarea, aprobadoEn: new Date().toISOString(), sesion: datos.session_id ?? null,
  huella: createHash('sha256').update(texto).digest('hex'),
}, null, 2));
process.stdout.write(`Aprobación de ${tarea} registrada por el usuario (DT-33). Ya podés correr pnpm pr:mergear con --aprobado para esa tarea.\n`);
process.exit(0);

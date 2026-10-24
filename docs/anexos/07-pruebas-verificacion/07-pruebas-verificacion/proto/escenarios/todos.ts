import type { Escenario } from './tipos';
const mods = import.meta.glob<{ default: Escenario }>('./datos/esc-*.ts', { eager: true });
export const ESCENARIOS = new Map(Object.values(mods).map(m => [m.default.id, m.default]));

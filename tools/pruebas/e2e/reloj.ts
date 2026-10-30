// Los tres relojes de la E2E (TA-219; DP-04, 07 §4.1): el archivo del servidor (CT-01) y `page.clock`, con el mismo
// instante. La base recibe el desfase que el servidor calcula de ese archivo, por transacción (`relojDeLaBase`, pila.ts).
// Vive fuera de `e2e/`: `fijadoEn` son los milisegundos reales al fijarlo (07 §4.1) y allí el lint prohíbe el reloj.
import { rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const ARCHIVO_RELOJ =
  process.env['FINN_RELOJ_ARCHIVO'] ?? join(tmpdir(), 'finn-reloj-e2e.json');

/** El servidor lo relee en cada petición (`relojDePrueba()`); fijar un instante nuevo es un salto. */
export function fijarRelojServidor(instante: string): void {
  writeFileSync(ARCHIVO_RELOJ, JSON.stringify({ instante, fijadoEn: Date.now() }));
}

/** Sin archivo el servidor usa el reloj real: una corrida no hereda el instante de la anterior. */
export function borrarRelojServidor(): void {
  rmSync(ARCHIVO_RELOJ, { force: true });
}

type PaginaConReloj = { clock: { install(o: { time: Date }): Promise<void> } };

/** Con el mismo instante, el servidor y el navegador. Antes de abrir la página: la agenda de medianoche lo lee (05 §6.7). */
export async function alinearRelojes(page: PaginaConReloj, instante: string): Promise<void> {
  fijarRelojServidor(instante);
  await page.clock.install({ time: new Date(instante) });
}

// CH-240 (entrega 4, E3-20 a E3-23, E4-3, E6-7): el selector de Registrar, Transferencia con una sola cuenta de efectivo y los flujos
// sin bloque de impacto. Cada prueba parte de una base sembrada con operaciones reales y del reloj del servidor fijo (DP-04); los textos
// salen del catálogo (FE-51) y los de referencia, de los HTML de la entrega 4 en `docs/anexos/`.
import { readFileSync } from 'node:fs';
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido, esperarHidratacion } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { registrarGasto as g } from '../../../src/textos/registrar-gasto.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';

const HOY = '2027-02-10';
const REFERENCIAS = '../../docs/anexos/finn-diseno-entrega-4/pantallas';

async function preparar(estadoInicial: Op[]): Promise<void> {
  fijarRelojServidor(`${HOY}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-REG-SELECTOR',
    titulo: 'Semilla del selector de Registrar',
    refs: [],
    hoy: HOY,
    estadoInicial,
    pasos: [],
  };
  await sembrar(escenario, HOY);
}

/** Los pares «título · detalle» de las tarjetas del selector de referencia (los dos `span` que siguen a cada ícono). */
function tiposDeReferencia(): Map<string, string> {
  const html = readFileSync(
    `${REFERENCIAS}/12-registrar-tipos-y-flujos-cortos/selector__telefono-claro.html`,
    'utf8',
  );
  const textos = [...html.matchAll(/<span[^>]*>([^<]+)<\/span>/g)].map((m) => (m[1] ?? '').trim());
  const mapa = new Map<string, string>();
  const i = textos.indexOf('Gasto');
  for (let k = i; k + 1 < textos.length; k += 2) mapa.set(textos[k] ?? '', textos[k + 1] ?? '');
  return mapa;
}

test.describe('PRU-E2E-TX registrar: selector y flujos cortos de la entrega 4', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-TX-711 [CA-E6-10] con una sola cuenta de efectivo, /registrar/transferencia muestra «Para transferir necesitás dos cuentas de efectivo.» y «Crear una cuenta», y el selector no ofrece Transferencia y lo dice', async ({
    page,
  }) => {
    await preparar([{ op: 'OP-01', cuenta: 'Ahorro', saldo: 0 }]);
    await page.goto('/registrar');
    await esperarContenido(page);
    await expect(page.getByRole('link', { name: /^Transferencia/ })).toHaveCount(0);
    await expect(page.locator('[data-rol="nota-tipos"]')).toContainText(g.sinTransferencia);

    await page.goto('/registrar/transferencia');
    await esperarHidratacion(page);
    await expect(
      page.getByRole('heading', { name: 'Para transferir necesitás dos cuentas de efectivo.' }),
    ).toBeVisible();
    await expect(page.getByText('Tenés una: Ahorro.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Crear una cuenta' })).toHaveAttribute(
      'href',
      '/cuentas/nueva',
    );
  });

  test('PRU-E2E-TX-712 [CA-E4-21c] Registrar gasto y Revisar movimiento no cambian ningún bloque de impacto al escribir el monto', async ({
    page,
  }) => {
    await preparar([
      { op: 'OP-01', cuenta: 'Ahorro' },
      { op: 'OP-07', categoria: 'Super' },
      { op: 'OP-21', monto: 500 },
      { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
    ]);
    await page.goto('/registrar/gasto');
    await esperarHidratacion(page);
    const total = page.getByLabel(g.total, { exact: true });
    await total.fill('12.34');
    // Ningún bloque de impacto aparece ni se actualiza: el efecto del tipo no depende de cifras (E4-2, E4-3)
    await expect(page.locator('main')).not.toContainText('Antes de guardar');
    await expect(page.locator('main')).not.toContainText('Después de aprobar');
    await expect(page.locator('main')).not.toContainText('Listo para asignar');
    await expect(page.locator('main [data-centavos]')).toHaveCount(0);
  });

  test('PRU-E2E-TX-713 [CA-E3-2] el selector de Registrar tiene los títulos y detalles del HTML de referencia para los tipos que se pueden sembrar', async ({
    page,
  }) => {
    await preparar([
      { op: 'OP-01', cuenta: 'Ahorro' },
      { op: 'OP-01', cuenta: 'Corriente' },
      { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', ultimos4: '1234' },
      { op: 'OP-01', cuenta: 'U', tipo: 'tarjeta', ultimos4: '5678' },
    ]);
    await page.goto('/registrar');
    await esperarContenido(page);
    const referencia = tiposDeReferencia();
    const sembrables = [
      'Gasto',
      'Ingreso',
      'Transferencia',
      'Devolución',
      'Avance de efectivo',
      'Entrada a una tarjeta',
      'Transferencia de deuda',
    ];
    for (const titulo of sembrables) {
      const detalle = referencia.get(titulo);
      expect(detalle, `la referencia no tiene «${titulo}»`).toBeDefined();
      const tarjeta = page.getByRole('link', { name: new RegExp(`^${titulo}`) }).filter({
        hasText: detalle ?? '',
      });
      await expect(tarjeta, titulo).toHaveCount(1);
      expect((await tarjeta.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    }
    // «Entrada a una tarjeta» es de FT-32 y lleva el ícono `coins` en su tarjeta
    await expect(page.getByRole('link', { name: /^Entrada a una tarjeta/ })).toHaveAttribute(
      'href',
      '/registrar/entrada-tarjeta',
    );
  });
});

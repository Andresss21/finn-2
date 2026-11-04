// FT-40 Administrar programadas (06 FT-40; 05 §2 y §7; 07 §17: un flujo es una E2E). Cada prueba parte de una base sembrada con las operaciones
// reales de un escenario de 01 §8 (DP-17) y del reloj del servidor fijo (DP-04), y recorre el flujo como la persona. Los números los pone el
// motor: la prueba solo comprueba que el flujo los dibuja y los envía (PF-3). También completa de punta a punta CA-19.1 y CA-19.5 (DT-27,
// `pruebas/pendientes-e2e.json`): el efecto de archivar una categoría sobre sus programadas se ve en `/programadas`.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const BASE: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'Visa Oro', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Streaming' },
  { op: 'OP-21', monto: 1000 },
];
const NETFLIX: Op = {
  op: 'OP-42',
  etiqueta: 'netflix',
  cuenta: 'Visa Oro',
  comercio: 'Netflix',
  monto: 15.49,
  categoria: 'Streaming',
  primeraFecha: '2027-02-17',
};
// ESC-44 paso 0: Gimnasio con $70.00 en P1, el débito de $30.00 del 2 de febrero, $30.00 en P3 (futuro) y una programada activa.
const ESC44_PASO0: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Gimnasio' },
  { op: 'OP-21', monto: 700, fecha: '2027-01-25', hoy: '2027-01-25' },
  { op: 'OP-14', categoria: 'Gimnasio', monto: 70, periodo: 'P1', hoy: '2027-01-25' },
  {
    op: 'OP-20',
    cuenta: 'Ahorro',
    monto: 30,
    categoria: 'Gimnasio',
    fecha: '2027-02-02',
    hoy: '2027-02-02',
    etiqueta: 'gimnasio',
  },
  { op: 'OP-14', categoria: 'Gimnasio', monto: 30, periodo: 'P3' },
  {
    op: 'OP-42',
    etiqueta: 'gimnasio',
    cuenta: 'Ahorro',
    comercio: 'Gimnasio',
    monto: 30,
    categoria: 'Gimnasio',
    primeraFecha: '2027-03-10',
  },
];

/** Siembra las operaciones con `hoy` y deja el reloj del servidor en `hoyServidor` (por defecto, el mismo día). */
async function sembrarOps(ops: Op[], hoy: string, hoyServidor = hoy): Promise<void> {
  fijarRelojServidor(`${hoyServidor}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-PROG',
    titulo: 'Semilla de FT-40',
    refs: [],
    hoy,
    estadoInicial: ops,
    pasos: [],
  };
  await sembrar(escenario, hoy);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

const lpa = (page: Page) => page.locator('[data-resumen-lpa] [data-centavos]').first();
const fila = (page: Page, comercio: string) =>
  page.locator('[data-programada]').filter({ has: page.getByText(comercio, { exact: true }) });

/** Llena el formulario de una programada de gasto mensual y la crea. */
async function crearNetflix(page: Page): Promise<void> {
  await abrir(page, '/programadas/nueva');
  await page.getByLabel('Cuenta', { exact: true }).selectOption({ label: 'Visa Oro' });
  await page.getByLabel('Comercio', { exact: true }).fill('Netflix');
  await page.getByLabel('Monto', { exact: true }).fill('15.49');
  await page.getByLabel('Categoría', { exact: true }).selectOption({ label: 'Streaming' });
  await page.getByLabel('Primera fecha').fill('2027-02-17');
  await page.getByRole('button', { name: 'Crear programada' }).click();
  await expect(page).toHaveURL(/\/programadas$/);
  await esperarContenido(page);
}

test.describe('PRU-E2E-PROG administrar programadas', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-PROG-101 RUTA-/programadas/nueva RUTA-/programadas [CA-40.1] crear la Netflix mensual de $15.49 el día 17 con Visa Oro a Streaming la deja en Programadas a 7 días y en los próximos pagos de Inicio, y una a 20 días solo en Programadas', async ({
    page,
  }) => {
    await sembrarOps(
      [...BASE, { ...NETFLIX, etiqueta: 'luz', comercio: 'Luz', primeraFecha: '2027-03-02' }],
      '2027-02-10',
    );
    await crearNetflix(page);
    await expect(fila(page, 'Netflix')).toHaveCount(1);
    await expect(page.locator('[data-seccion="proximos"] [data-proximo]')).toHaveCount(2);
    await abrir(page, '/');
    const proximos = page.locator('[data-seccion="proximos-pagos"]');
    await expect(proximos).toContainText('Netflix');
    await expect(proximos).not.toContainText('Luz');
  });

  test('PRU-E2E-PROG-102 RUTA-/programadas/[programadaId] [CA-40.2] con una ocurrencia registrada el día y la frecuencia quedan sin edición con el motivo de calendario_con_historial y cambiar el monto sí se guarda', async ({
    page,
  }) => {
    await sembrarOps(
      [
        ...BASE,
        NETFLIX,
        { op: 'OP-43', modo: 'toque', programada: 'netflix', fecha: '2027-02-17' },
      ],
      '2027-02-20',
    );
    await abrir(page, '/programadas');
    await page
      .getByRole('link', { name: /Netflix/ })
      .first()
      .click();
    await esperarContenido(page);
    await expect(page.getByLabel('Primera fecha')).toBeDisabled();
    await expect(page.getByLabel('Frecuencia')).toBeDisabled();
    await expect(page.getByText(/ya tiene pagos registrados/)).toBeVisible();
    await page.getByLabel('Monto', { exact: true }).fill('17.99');
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page).toHaveURL(/\/programadas$/);
    await esperarContenido(page);
    await expect(fila(page, 'Netflix')).toContainText('$17.99');
  });

  test('PRU-E2E-PROG-103 RUTA-/programadas/[programadaId] [CA-40.3] una programada sin historial se elimina y desaparece, y con historial Eliminar no se ofrece', async ({
    page,
  }) => {
    await sembrarOps(
      [
        ...BASE,
        NETFLIX,
        { op: 'OP-43', modo: 'toque', programada: 'netflix', fecha: '2027-02-17' },
        { ...NETFLIX, etiqueta: 'gym', comercio: 'Gimnasio', primeraFecha: '2027-03-05' },
      ],
      '2027-02-20',
    );
    await abrir(page, '/programadas');
    await fila(page, 'Netflix').getByRole('link').click();
    await esperarContenido(page);
    await expect(page.getByRole('button', { name: 'Eliminar', exact: true })).toHaveCount(0);
    await abrir(page, '/programadas');
    await fila(page, 'Gimnasio').getByRole('link').click();
    await esperarContenido(page);
    await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
    await expect(page).toHaveURL(/\/programadas$/);
    await esperarContenido(page);
    await expect(fila(page, 'Gimnasio')).toHaveCount(0);
    await expect(fila(page, 'Netflix')).toHaveCount(1);
  });

  test('PRU-E2E-PROG-104 RUTA-/programadas/nueva [CA-40.4] una cuota con registro automático hacia un préstamo sin modelo se rechaza con registro_automatico_sin_modelo', async ({
    page,
  }) => {
    await sembrarOps(
      [
        ...BASE,
        {
          op: 'OP-01',
          cuenta: 'Préstamo',
          tipo: 'prestamo',
          saldo: 5000,
          prestamo: {
            contraparte: 'Banco',
            montoOriginal: 6000,
            cuota: 210,
            plazoCuotas: 60,
            cuotasPagadas: 10,
          },
        },
        { op: 'OP-07', categoria: 'Cuotas' },
      ],
      '2027-02-10',
    );
    await abrir(page, '/programadas/nueva');
    await page.getByRole('radio', { name: 'Cuota' }).click();
    await page.getByLabel('Cuenta', { exact: true }).selectOption({ label: 'Ahorro' });
    await page.getByLabel('Cuenta de destino').selectOption({ label: 'Préstamo' });
    await page.getByLabel('Comercio', { exact: true }).fill('Cuota del préstamo');
    await page.getByLabel('Monto', { exact: true }).fill('210');
    await page.getByLabel('Categoría', { exact: true }).selectOption({ label: 'Cuotas' });
    await page.getByLabel('Primera fecha').fill('2027-02-20');
    await page.getByRole('switch', { name: 'Registrar sola en su fecha' }).check();
    await page.getByRole('button', { name: 'Crear programada' }).click();
    await expect(
      page.getByText('Para registrar sola una cuota, el préstamo necesita un modelo de cálculo.'),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/programadas\/nueva/);
  });

  test('PRU-E2E-PROG-105 RUTA-/programadas [CA-40.5] la mensual del 17 desactivada el 1 de junio y reactivada el 20 de septiembre no tiene atrasadas y su próxima es el 17 de octubre', async ({
    page,
  }) => {
    await sembrarOps(
      [...BASE, { ...NETFLIX, primeraFecha: '2027-06-17' }],
      '2027-05-25',
      '2027-06-01',
    );
    await abrir(page, '/programadas');
    await fila(page, 'Netflix').getByRole('link').click();
    await esperarContenido(page);
    await page.getByRole('button', { name: 'Desactivar', exact: true }).click();
    await expect(page.getByTestId('resultado')).toBeVisible();

    fijarRelojServidor('2027-09-20T10:00:00-06:00');
    await abrir(page, '/programadas');
    await fila(page, 'Netflix').getByRole('button', { name: 'Reactivar', exact: true }).click();
    await expect(page.getByTestId('resultado')).toBeVisible();

    await abrir(page, '/programadas');
    await expect(page.locator('[data-seccion="atrasadas"]')).toHaveCount(0);
    await expect(page.locator('[data-seccion="proximos"] [data-proximo]')).toContainText('17');
  });

  test('PRU-E2E-PROG-106 RUTA-/programadas/[programadaId] [CA-40.7] desactivar una programada deja el resultado con Reactivar y tocarlo la vuelve a dejar activa', async ({
    page,
  }) => {
    await sembrarOps([...BASE, NETFLIX], '2027-02-10');
    await abrir(page, '/programadas');
    await fila(page, 'Netflix').getByRole('link').click();
    await esperarContenido(page);
    await page.getByRole('button', { name: 'Desactivar', exact: true }).click();
    const resultado = page.getByTestId('resultado');
    await expect(resultado).toContainText('quedó desactivada');
    await resultado.getByRole('button', { name: 'Reactivar' }).click();
    await expect(resultado).toContainText('quedó activa');
    await abrir(page, '/programadas');
    await expect(fila(page, 'Netflix')).not.toContainText('Desactivada');
    await expect(page.locator('[data-seccion="proximos"] [data-proximo]')).toHaveCount(1);
  });

  test('PRU-E2E-PROG-107 RUTA-/programadas/nueva [CA-40.8] crear, editar y desactivar una programada no cambia Listo para asignar', async ({
    page,
  }) => {
    await sembrarOps(BASE, '2027-02-10');
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 100000);
    await crearNetflix(page);
    await fila(page, 'Netflix').getByRole('link').click();
    await esperarContenido(page);
    await page.getByLabel('Monto', { exact: true }).fill('20');
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page).toHaveURL(/\/programadas$/);
    await fila(page, 'Netflix').getByRole('link').click();
    await esperarContenido(page);
    await page.getByRole('button', { name: 'Desactivar', exact: true }).click();
    await expect(page.getByTestId('resultado')).toBeVisible();
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 100000);
  });

  test('PRU-E2E-PROG-108 RUTA-/programadas [CA-19.1, ESC-44] archivar Gimnasio con la programada desactivada la deja inactiva en Programadas', async ({
    page,
  }) => {
    await sembrarOps(ESC44_PASO0, '2027-03-05');
    await abrir(page, '/presupuesto/estructura');
    await page.getByRole('link', { name: 'Editar Gimnasio', exact: true }).click();
    await page.getByRole('link', { name: 'Archivar', exact: true }).click();
    await page
      .getByRole('radiogroup', { name: /Programada Gimnasio/ })
      .getByRole('radio', { name: 'Desactivarla' })
      .click();
    await page.getByRole('button', { name: 'Archivar', exact: true }).click();
    await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
    await expect(page).toHaveURL(/\/presupuesto\/categorias\/[0-9a-f-]+$/);

    await abrir(page, '/programadas');
    await expect(fila(page, 'Gimnasio')).toContainText('Desactivada');
    await expect(fila(page, 'Gimnasio').getByRole('button', { name: 'Reactivar' })).toBeVisible();
    await expect(page.locator('[data-seccion="proximos"] [data-proximo]')).toHaveCount(0);
  });

  test('PRU-E2E-PROG-109 RUTA-/programadas [CA-19.5, ESC-44] archivar una categoría con una programada activa sin decidir sobre ella no se envía y la programada sigue activa en Programadas', async ({
    page,
  }) => {
    await sembrarOps(ESC44_PASO0, '2027-03-05');
    await abrir(page, '/presupuesto/estructura');
    await page.getByRole('link', { name: 'Editar Gimnasio', exact: true }).click();
    await page.getByRole('link', { name: 'Archivar', exact: true }).click();
    await page.getByRole('button', { name: 'Archivar', exact: true }).click();
    await expect(page.getByText('Elegí una opción.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Revisá el impacto' })).toHaveCount(0);

    await abrir(page, '/programadas');
    await expect(fila(page, 'Gimnasio')).not.toContainText('Desactivada');
    await expect(page.locator('[data-seccion="proximos"] [data-proximo]')).toHaveCount(1);
  });
});

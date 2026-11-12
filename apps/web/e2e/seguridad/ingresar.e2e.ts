// Entrega 4, acceso: Ingresar (CH-240; 05 §9.3). El ojo, los campos vacíos y el estado sin conexión que deshabilita «Ingresar».
// «Demasiados intentos» deshabilitado se prueba como componente (PRU-CMP-ACCESO-703): no hay forma barata de provocarlo en E2E.
import { expect, test } from '../configuracion/semilla.ts';
import { esperarHidratacion } from '../ayudas/esperas.ts';
import { ingreso as t } from '../../src/textos/ingreso.ts';

test.describe('PRU-E2E-ACCESO', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies();
    await page.goto('/ingresar');
    await esperarHidratacion(page);
  });

  test('PRU-E2E-ACCESO-701 [] el ojo muestra y oculta la contraseña con aria-pressed; enviar vacío marca los dos campos con su error', async ({
    page,
  }) => {
    const campo = page.getByLabel(t.contrasena, { exact: true });
    await campo.fill('una-clave');
    const ojo = page.getByRole('button', { name: t.mostrarContrasena });
    await expect(ojo).toHaveAttribute('aria-pressed', 'false');
    await ojo.click();
    await expect(campo).toHaveAttribute('type', 'text');
    await expect(page.getByRole('button', { name: t.ocultarContrasena })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.getByRole('button', { name: t.ocultarContrasena }).click();
    await expect(campo).toHaveAttribute('type', 'password');
    await campo.fill('');
    await page.getByRole('button', { name: t.ingresar }).click();
    await expect(page.getByText(t.escribiEmail)).toBeVisible();
    await expect(page.getByText(t.escribiContrasena)).toBeVisible();
    await expect(page.getByLabel(t.email)).toHaveAttribute('aria-invalid', 'true');
    await expect(campo).toHaveAttribute('aria-invalid', 'true');
  });

  test('PRU-E2E-ACCESO-702 [] sin conexión «Ingresar» queda deshabilitado con su motivo enlazado', async ({
    page,
    context,
  }) => {
    const boton = page.getByRole('button', { name: t.ingresar });
    await context.setOffline(true);
    await expect(boton).toBeDisabled();
    await expect(boton).toHaveAccessibleDescription(t.sinConexionIngresar);
    await context.setOffline(false);
    await expect(boton).toBeEnabled();
  });
});

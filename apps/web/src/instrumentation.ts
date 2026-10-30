// Barrera 1 del reloj de prueba (CT-01, P7-10; 07 §4.3, 04 §13.1.4): fuera de la lista de permitidos, si existe una
// variable del reloj, aunque esté vacía, la app no arranca. Portado del prototipo de V7-07. Todo va dentro de la guarda,
// escrita para que el compilador la resuelva: `@finn/aplicacion` usa `node:fs` y `process.exit` no existe en edge.
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { hayVariableDeReloj, relojPermitido } = await import('@finn/aplicacion');
    if (!relojPermitido() && hayVariableDeReloj()) {
      console.error(
        'finn: reloj de prueba fuera de un entorno de pruebas; la aplicación no arranca (BE-30, CT-01)',
      );
      process.exit(1);
    }
  }
}

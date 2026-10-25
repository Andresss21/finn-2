// Control negativo de TA-004: debe fallar con la regla indicada.
// ruta: apps/web/src/servidor/lecturas/pendientes.ts
// regla: tools/ci/lecturas-interactivas
'use server';
export async function leerPresupuesto(): Promise<null> {
  return null;
}

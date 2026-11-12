// GLO-26 (entrega 2, D1 a D4): donde el diseño pone un botón tonal, un botón tonal de 44 px y no un enlace subrayado. Las acciones
// de `Resultado`, `Vacio` y los avisos llegan como enlaces (`ReactNode`); esta clase da a los `a` del contenedor la forma del botón.
// Clase literal (L13).
export const ACCION_TONAL =
  '[&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:justify-center [&_a]:gap-2 [&_a]:rounded-control [&_a]:bg-accion-tonal [&_a]:px-4 [&_a]:font-semibold [&_a]:text-accion [&_a]:no-underline [&_a]:hover:bg-superficie-hundida';

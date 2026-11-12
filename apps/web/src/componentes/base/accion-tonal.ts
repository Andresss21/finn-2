// GLO-26 (entrega 2, D1 a D4): donde el diseño pone un botón tonal, un botón tonal de 44 px y no un enlace subrayado. Las acciones
// de `Resultado`, `Vacio` y los avisos llegan como enlaces (`ReactNode`); esta clase da a los `a` del contenedor la forma del botón (salvo los que ya traen su fondo, que ya son un botón).
// Clase literal (L13).
export const ACCION_TONAL =
  '[&_a:not([class*=bg-])]:inline-flex [&_a:not([class*=bg-])]:min-h-11 [&_a:not([class*=bg-])]:items-center [&_a:not([class*=bg-])]:justify-center [&_a:not([class*=bg-])]:gap-2 [&_a:not([class*=bg-])]:rounded-control [&_a:not([class*=bg-])]:bg-accion-tonal [&_a:not([class*=bg-])]:px-4 [&_a:not([class*=bg-])]:font-semibold [&_a:not([class*=bg-])]:text-accion [&_a:not([class*=bg-])]:no-underline [&_a:not([class*=bg-])]:hover:bg-superficie-hundida';

// La clave del borrador de un flujo (05 §4.11): sin dependencias de Next, para que una pantalla que solo deja valores iniciales
// en el borrador de otro flujo (Suscripciones detectadas, 06 FT-65) no cargue `useBorrador`.
export const PREFIJO_BORRADOR = 'finn:borrador:';

/** Clave de 4.11: la ruta sin parámetros de búsqueda y el id de la entidad, si la hay. */
export const claveDeBorrador = (ruta: string, entidad = ''): string =>
  `${PREFIJO_BORRADOR}v1:${ruta.split('?')[0] ?? ruta}:${entidad}`;

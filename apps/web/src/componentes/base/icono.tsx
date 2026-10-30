// Íconos de la interfaz y glifos de estado (06-identidad-visual §2, 05 §10.7). Dibujo con `currentColor`: el color lo pone el contexto.
import { GLIFOS, ICONOS } from './iconos/registro';

export type NombreIcono = keyof typeof ICONOS | keyof typeof GLIFOS;

interface PropsIcono {
  readonly nombre: NombreIcono;
  /** Nombre accesible. Sin él, el ícono acompaña un texto y queda oculto a los lectores de pantalla. */
  readonly etiqueta?: string;
  /** Lado en píxeles; los dibujos son de 24. */
  readonly tamano?: number;
  readonly className?: string;
}

const dibujo = (nombre: NombreIcono): { trazo: number; contenido: string } =>
  nombre in GLIFOS
    ? { trazo: 1.8, contenido: GLIFOS[nombre as keyof typeof GLIFOS] }
    : { trazo: 1.5, contenido: ICONOS[nombre as keyof typeof ICONOS] };

export function Icono({ nombre, etiqueta, tamano = 20, className }: PropsIcono) {
  const { trazo, contenido } = dibujo(nombre);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={trazo}
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={className}
      {...(etiqueta === undefined
        ? { 'aria-hidden': true, focusable: false }
        : { role: 'img', 'aria-label': etiqueta })}
      dangerouslySetInnerHTML={{ __html: contenido }}
    />
  );
}

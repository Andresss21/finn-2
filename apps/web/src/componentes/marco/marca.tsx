// Símbolo y nombre de Finn (05 §10.11; 06-identidad-visual 3.2): el cuadrado `marca` con el símbolo de `public/marca/` y
// «Finn» en texto. El símbolo es `simbolo.svg` usado como máscara para que tome `currentColor` y cambie con el tema:
// como `<img>` no heredaría el color. Decorativo: el nombre va al lado en texto.
import { navegacion } from '../../textos/navegacion';

const MASCARA = 'url(/marca/simbolo.svg) center / contain no-repeat';

export function Marca() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="inline-flex size-8.5 items-center justify-center rounded-control bg-marca text-texto-sobre-marca"
      >
        <span className="size-4.5 bg-current" style={{ mask: MASCARA, WebkitMask: MASCARA }} />
      </span>
      <span className="text-titulo-seccion">{navegacion.marca}</span>
    </span>
  );
}

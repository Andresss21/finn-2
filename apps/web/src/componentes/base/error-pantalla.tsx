// Error de una pantalla (06-identidad-visual 2.19, 05 §7.3): el estado `problema` con su glifo, el texto y «Intentar de nuevo».
import { base } from '../../textos/base';
import { Boton } from './boton';
import { Icono } from './icono';

export interface PropsErrorPantalla {
  readonly titulo?: string;
  readonly texto?: string;
  /** Lo que se busca en el diagnóstico (el `idError`, 05 §7.3), ya con su rótulo. */
  readonly referencia?: string;
  /** Si falta, no hay botón (por ejemplo, en un error que reintentar no arregla). */
  readonly reintentar?: () => void;
}

export function ErrorPantalla({
  titulo = base.errorTitulo,
  texto = base.errorTexto,
  referencia,
  reintentar,
}: PropsErrorPantalla) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-4 py-8 text-center">
      <span className="flex size-18 items-center justify-center rounded-pastilla bg-problema-fondo text-problema-texto">
        <Icono nombre="problema" tamano={32} />
      </span>
      <h2 className="text-titulo-seccion text-texto">{titulo}</h2>
      <p className="text-cuerpo-pequeno max-w-70 text-texto-secundario">{texto}</p>
      {referencia === undefined ? null : (
        <p className="text-cuerpo-pequeno text-texto-secundario">{referencia}</p>
      )}
      {reintentar === undefined ? null : (
        <Boton variante="secundaria" onClick={reintentar}>
          {base.reintentar}
        </Boton>
      )}
    </div>
  );
}

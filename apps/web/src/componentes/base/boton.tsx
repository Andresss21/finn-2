// Botón de Finn (05 §10.7). `<button>` nativo; deshabilitado con motivo visible; enviando sin perder el foco (4.3).
import { useId, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Button, type VarianteBoton } from '../../components/ui/button';
import { base } from '../../textos/base';
import './base.css';

export interface PropsBoton extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'type' | 'disabled' | 'children'
> {
  readonly variante?: VarianteBoton;
  readonly tipo?: 'button' | 'submit' | 'reset';
  readonly deshabilitado?: boolean;
  /** Se muestra en texto bajo el botón y se asocia con `aria-describedby` (7.7). */
  readonly motivoDeshabilitado?: string;
  readonly enviando?: boolean;
  readonly textoEnviando?: string;
  readonly children: ReactNode;
}

export function Boton({
  variante = 'principal',
  tipo = 'button',
  deshabilitado = false,
  motivoDeshabilitado,
  enviando = false,
  textoEnviando = base.guardando,
  children,
  onClick,
  ...resto
}: PropsBoton) {
  const idMotivo = useId();
  const conMotivo = deshabilitado && motivoDeshabilitado !== undefined;
  const boton = (
    <Button
      {...resto}
      variante={variante}
      type={tipo}
      disabled={deshabilitado}
      aria-disabled={enviando ? true : undefined}
      aria-describedby={conMotivo ? idMotivo : resto['aria-describedby']}
      // Enviando no usa `disabled` (se perdería el foco): se ignora el clic y el envío del formulario.
      onClick={
        enviando
          ? (e) => {
              e.preventDefault();
            }
          : onClick
      }
    >
      {enviando ? (
        <>
          <span className="f-giro" aria-hidden="true" />
          {textoEnviando}
        </>
      ) : (
        children
      )}
    </Button>
  );
  if (!conMotivo) return boton;
  return (
    <span>
      {boton}
      <span id={idMotivo} className="f-boton-motivo">
        {motivoDeshabilitado}
      </span>
    </span>
  );
}

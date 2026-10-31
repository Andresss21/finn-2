// Botón de Finn (05 §10.7). `<button>` nativo; deshabilitado con motivo visible; enviando sin perder el foco (4.3).
import { useId, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Button } from '../../components/ui/button';
import { base } from '../../textos/base';

type VarianteBoton = 'principal' | 'secundaria' | 'peligro' | 'discreta' | 'pastilla';

// Variantes de Finn (05 §10.7) sobre las de shadcn.
const VARIANTES = {
  principal: 'default',
  secundaria: 'tonal',
  peligro: 'destructive',
  discreta: 'ghost',
  pastilla: 'pill',
} as const;

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
      variant={VARIANTES[variante]}
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
          <span
            className="size-4 animate-spin rounded-pastilla border-2 border-current border-e-transparent"
            aria-hidden="true"
          />
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
      <span id={idMotivo} className="mt-1 block text-sm text-texto-secundario">
        {motivoDeshabilitado}
      </span>
    </span>
  );
}

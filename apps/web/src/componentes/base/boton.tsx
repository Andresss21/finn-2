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

// CAMPOS-V3 §11: falta algo → superficie hundida y texto deshabilitado, sin perder el foco ni el clic.
const APAGADO =
  'bg-superficie-hundida text-texto-deshabilitado hover:bg-superficie-hundida aria-disabled:cursor-pointer';

export interface PropsBoton extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'type' | 'disabled' | 'children'
> {
  readonly variante?: VarianteBoton;
  readonly tipo?: 'button' | 'submit' | 'reset';
  readonly deshabilitado?: boolean;
  /** Se muestra en texto bajo el botón y se asocia con `aria-describedby` (7.7). */
  readonly motivoDeshabilitado?: string;
  /**
   * [CH-268] Se ve apagado mientras falte algo, pero sigue siendo tocable (C-45, CAMPOS-V3 §5 y §11; 05 §4.3): `aria-disabled`
   * en lugar de `disabled`, y el motivo debajo. Al tocarlo, el formulario marca los errores y lleva el foco al primero.
   */
  readonly apagado?: boolean;
  readonly enviando?: boolean;
  readonly textoEnviando?: string;
  readonly children: ReactNode;
}

export function Boton({
  variante = 'principal',
  tipo = 'button',
  deshabilitado = false,
  motivoDeshabilitado,
  apagado = false,
  enviando = false,
  textoEnviando = base.guardando,
  children,
  onClick,
  className,
  ...resto
}: PropsBoton) {
  const idMotivo = useId();
  const conMotivo = (deshabilitado || apagado) && motivoDeshabilitado !== undefined;
  const boton = (
    <Button
      {...resto}
      variant={VARIANTES[variante]}
      type={tipo}
      disabled={deshabilitado}
      aria-disabled={enviando || apagado ? true : undefined}
      className={apagado && !enviando ? `${APAGADO} ${className ?? ''}` : className}
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

// Primitivo de botón al estilo shadcn/ui, con las clases de Finn (05 §10.7, capa 1). Solo se importa desde componentes/base.
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from './utils';

export type VarianteBoton = 'principal' | 'secundaria' | 'peligro' | 'discreta' | 'pastilla';

export interface PropsButton extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variante?: VarianteBoton;
}

const CLASES: Record<VarianteBoton, string> = {
  principal: 'f-boton f-boton-principal',
  secundaria: 'f-boton f-boton-secundaria',
  peligro: 'f-boton f-boton-peligro',
  discreta: 'f-boton f-boton-discreta',
  pastilla: 'f-boton f-boton-pastilla',
};

export const Button = forwardRef<HTMLButtonElement, PropsButton>(function Button(
  { variante = 'principal', className, type = 'button', ...resto },
  ref,
) {
  return <button ref={ref} type={type} className={cn(CLASES[variante], className)} {...resto} />;
});

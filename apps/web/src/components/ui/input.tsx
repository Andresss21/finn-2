import * as React from 'react';
import { cn } from './utils';

// Las clases viven fuera del JSX: L15 no distingue el prefijo `disabled:` y el estado se declara en la misma cadena.
const CAJA =
  'min-h-12 w-full rounded-t-control rounded-b-sm border-b-2 border-borde-control bg-superficie px-3 text-base text-texto placeholder:text-texto-terciario focus-visible:border-b-4 focus-visible:border-foco focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco disabled:bg-superficie-hundida disabled:text-texto-deshabilitado read-only:bg-superficie-hundida aria-invalid:border-2 aria-invalid:border-problema-borde';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return <input type={type} className={cn(CAJA, className)} {...props} />;
}

export { Input };

// Primitivo de entrada de texto al estilo shadcn/ui (05 §10.7, capa 1).
import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from './utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...resto }, ref) {
    return <input ref={ref} className={cn('f-caja', className)} {...resto} />;
  },
);

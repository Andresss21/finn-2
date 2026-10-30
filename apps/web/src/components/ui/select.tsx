// Primitivo de lista desplegable nativa al estilo shadcn/ui (05 §10.7, capa 1).
import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from './utils';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, ...resto }, ref) {
    return <select ref={ref} className={cn('f-caja f-lista', className)} {...resto} />;
  },
);

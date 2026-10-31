import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from './utils';

// Variantes de shadcn con los tokens de Finn (05 §10.7): solo cambian los colores y las medidas.
const buttonVariants = cva(
  'inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-control px-5 text-base font-semibold whitespace-nowrap transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco disabled:cursor-not-allowed disabled:bg-superficie-hundida disabled:text-texto-deshabilitado aria-disabled:cursor-progress',
  {
    variants: {
      variant: {
        default:
          'min-h-12 bg-accion text-texto-sobre-accion hover:bg-accion-hover active:bg-accion-presionada',
        tonal:
          'min-h-12 bg-accion-tonal text-accion hover:bg-superficie-hundida active:bg-superficie-hundida',
        destructive:
          'min-h-12 bg-peligro text-texto-sobre-peligro hover:opacity-90 active:opacity-80',
        ghost: 'bg-transparent px-3 text-enlace hover:underline active:bg-superficie-hundida',
        filter:
          'rounded-pastilla bg-superficie-hundida px-4 text-base font-normal text-texto hover:bg-borde-sutil active:bg-borde-control aria-pressed:bg-texto aria-pressed:font-bold aria-pressed:text-fondo',
        pill: 'rounded-pastilla bg-accion px-4 text-sm font-bold text-texto-sobre-accion hover:bg-accion-hover active:bg-accion-presionada',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

function Button({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, className }))} {...props} />;
}

export { Button, buttonVariants };

'use client';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import * as React from 'react';
import { cn } from './utils';

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root className={cn('grid gap-1', className)} {...props} />;
}

// El botón mide 44 × 44 px (05 §11.5); el círculo visible de 24 px va dentro.
function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        'group flex size-11 shrink-0 items-center justify-center rounded-pastilla focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    >
      <span className="flex size-6 items-center justify-center rounded-pastilla border-2 border-borde-control bg-superficie group-disabled:border-texto-deshabilitado">
        <RadioGroupPrimitive.Indicator className="size-3 rounded-pastilla bg-accion" />
      </span>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };

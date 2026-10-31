'use client';
import * as SelectPrimitive from '@radix-ui/react-select';
import * as React from 'react';
import { Icono } from '../../componentes/base/icono';
import { cn } from './utils';

const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;

const CLASES_DISPARADOR =
  'flex min-h-12 w-full items-center justify-between gap-2 rounded-t-control rounded-b-sm border-b-2 border-borde-control bg-superficie px-3 text-base text-texto focus-visible:border-b-4 focus-visible:border-foco focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco disabled:cursor-not-allowed disabled:bg-superficie-hundida disabled:text-texto-deshabilitado aria-invalid:border-2 aria-invalid:border-problema-borde';

function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger className={cn(CLASES_DISPARADOR, className)} {...props}>
      {children}
      <SelectPrimitive.Icon>
        <Icono nombre="chevD" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = 'popper',
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position={position}
        className={cn(
          'relative z-50 max-h-80 min-w-32 overflow-y-auto rounded-contenedor bg-superficie-elevada text-texto shadow-elevacion-2',
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="w-full min-w-(--radix-select-trigger-width) p-1">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

const CLASES_ITEM =
  'relative flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-control px-3 text-base outline-none data-highlighted:bg-superficie-hundida data-disabled:text-texto-deshabilitado';

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item className={cn(CLASES_ITEM, className)} {...props}>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="ml-auto">
        <Icono nombre="check" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };

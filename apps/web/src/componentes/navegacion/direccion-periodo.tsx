'use client';
// C12 (CH-220): al cambiar de período, el contenido entra desde el lado que corresponde (320 ms, `--duracion-periodo`). Todo en el
// cliente: la flecha del selector anota hacia qué período va y en qué dirección; la pantalla, al montarse con ese período, anima
// su contenido. El servidor no sabe de dónde se vino. Con movimiento reducido, la regla global de `globals.css` quita la animación.
import { useLayoutEffect, type ComponentProps } from 'react';
import { EnlaceFinn } from './enlace-finn';

type Direccion = 'anterior' | 'siguiente';

/** La última flecha tocada: el período al que lleva y su dirección. Vive en el módulo, no en la URL ni en el almacenamiento. */
let pendiente: { readonly inicio: string; readonly direccion: Direccion } | null = null;

export function EnlacePeriodo({
  inicio,
  direccion,
  ...props
}: ComponentProps<typeof EnlaceFinn> & { readonly inicio: string; readonly direccion: Direccion }) {
  return (
    <EnlaceFinn
      {...props}
      onClick={() => {
        pendiente = { inicio, direccion };
      }}
    />
  );
}

const CLASE: Readonly<Record<Direccion, string>> = {
  anterior: 'fz-periodo-anterior',
  siguiente: 'fz-periodo-siguiente',
};

/** Anima el elemento `objetivo` si se llegó a `inicio` por una flecha del selector; si no, no hace nada. */
export function EntradaDePeriodo({
  inicio,
  objetivo,
}: {
  readonly inicio: string;
  readonly objetivo: string;
}) {
  useLayoutEffect(() => {
    const p = pendiente;
    pendiente = null;
    const el = document.getElementById(objetivo);
    if (p?.inicio !== inicio || el === null) return;
    const clase = CLASE[p.direccion];
    el.classList.add(clase);
    // Solo la animación propia: las de los montos de adentro también burbujean `animationend`.
    const alTerminar = (e: AnimationEvent) => {
      if (e.target === el) el.classList.remove(clase);
    };
    el.addEventListener('animationend', alTerminar);
    return () => {
      el.removeEventListener('animationend', alTerminar);
      el.classList.remove(clase);
    };
  }, [inicio, objetivo]);
  return null;
}

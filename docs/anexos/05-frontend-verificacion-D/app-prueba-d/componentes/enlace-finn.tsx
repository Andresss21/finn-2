'use client';
import Link, { useLinkStatus } from 'next/link';
// Prototipo de EnlaceFinn (05 §3.3, FE-39) con la regla de 7.4 [R3]: sin conexión no navega y avisa al marco.
function Senal() { const { pending } = useLinkStatus(); return <span data-pendiente={pending ? 'si' : 'no'} aria-hidden="true">{pending ? ' …' : ''}</span>; }
export function EnlaceFinn({ onClick, ...props }: React.ComponentProps<typeof Link>) {
  return <Link {...props} onClick={(e) => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      e.preventDefault(); window.dispatchEvent(new CustomEvent('finn:navegacion-sin-conexion', { detail: String(props.href) })); return;
    }
    onClick?.(e);
  }}>{props.children}<Senal /></Link>;
}

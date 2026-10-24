'use client';
import Link, { useLinkStatus } from 'next/link';
function Indicador() { const { pending } = useLinkStatus(); return pending ? <span data-testid="enlace-pendiente" aria-hidden="true"> …</span> : null; }
export function EnlaceConEstado({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} prefetch={false}>{children}<Indicador /></Link>;
}

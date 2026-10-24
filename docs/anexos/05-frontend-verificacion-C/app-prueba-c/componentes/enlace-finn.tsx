'use client';
import Link, { useLinkStatus } from 'next/link';
function Senal() { const { pending } = useLinkStatus(); return <span data-pendiente={pending ? 'si' : 'no'} aria-hidden="true">{pending ? ' …' : ''}</span>; }
export function EnlaceFinn(props: React.ComponentProps<typeof Link>) {
  return <Link {...props}>{props.children}<Senal /></Link>;
}

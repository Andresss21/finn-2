'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
export function Refrescar() {
  const router = useRouter();
  const [borrador, setBorrador] = useState('');
  return (<div><input aria-label="Borrador" value={borrador} onChange={(e) => setBorrador(e.target.value)} />
    <button type="button" onClick={() => router.refresh()}>Refrescar</button></div>);
}

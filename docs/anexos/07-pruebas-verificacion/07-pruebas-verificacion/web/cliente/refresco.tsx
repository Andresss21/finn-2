'use client';
// Agenda de la medianoche de 05 §6.7 (pasos 1–3), reducida.
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
export function RefrescoMedianoche({ hoy }: { hoy: string }) {
  const router = useRouter(); const ultimo = useRef<string | null>(null);
  useEffect(() => {
    const [a, m, d] = hoy.split('-').map(Number);
    const objetivo = Date.UTC(a, m - 1, d + 1, 6, 0, 5);           // hoy + 1 día, 00:00:05 en El Salvador (UTC−6)
    const espera = objetivo - Date.now();
    if (espera <= 0) { if (ultimo.current !== hoy) { ultimo.current = hoy; router.refresh(); } else { const t = setTimeout(() => router.refresh(), 60_000); return () => clearTimeout(t); } return; }
    const t = setTimeout(() => router.refresh(), Math.min(espera, 2 ** 31 - 1));
    return () => clearTimeout(t);
  }, [hoy, router]);
  return null;
}

'use client';
// Prototipo de RegistroServiceWorker (05 §8.4): registra, detecta una versión instalada que espera y la activa con "Recargar".
import { useEffect, useState } from 'react';
export function RegistroServiceWorker() {
  const [espera, setEspera] = useState<ServiceWorker | null>(null);
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let recargando = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (recargando) return; recargando = true; location.reload(); });
    navigator.serviceWorker.register('/serwist/sw.js', { scope: '/', updateViaCache: 'none' }).then((reg) => {
      const revisar = () => { if (reg.waiting && navigator.serviceWorker.controller) setEspera(reg.waiting); };
      revisar();
      reg.addEventListener('updatefound', () => { const w = reg.installing; w?.addEventListener('statechange', () => { if (w.state === 'installed') revisar(); }); });
      (window as unknown as { __finnSw: ServiceWorkerRegistration }).__finnSw = reg;
    });
  }, []);
  useEffect(() => { document.documentElement.dataset.hidratado = 'si'; document.documentElement.dataset.cliente = process.env.NEXT_PUBLIC_FINN_VERSION ?? 'dev'; }, []);
  if (!espera) return null;
  return (<div role="alert" data-testid="version-nueva">Hay una versión nueva.
    <button onClick={() => espera.postMessage({ type: 'SKIP_WAITING' })}>Recargar</button></div>);
}

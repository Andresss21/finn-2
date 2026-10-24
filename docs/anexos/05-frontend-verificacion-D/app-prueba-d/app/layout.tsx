import './globals.css';
import { RegistroServiceWorker } from '@/cliente/registro-sw';
export const metadata = { title: 'Prueba PWA', manifest: '/manifest.webmanifest' };
export const viewport = { themeColor: [{ media: '(prefers-color-scheme: light)', color: '#FAFAFA' }, { media: '(prefers-color-scheme: dark)', color: '#09090B' }] };
export default function Raiz({ children }: { children: React.ReactNode }) {
  return (<html lang="es" data-version={process.env.FINN_VERSION ?? 'dev'}><body className="font-sans">{children}<RegistroServiceWorker /></body></html>);
}

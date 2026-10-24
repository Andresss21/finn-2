import './globals.css';
export const metadata = { title: 'Prueba de tokens' };
export default function Raiz({ children }: { children: React.ReactNode }) {
  return (<html lang="es"><body className="font-sans">{children}</body></html>);
}

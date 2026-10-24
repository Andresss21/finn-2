export default function Raiz({ children }: { children: React.ReactNode }) {
  return (<html lang="es"><body>
    <nav aria-label="Navegación principal">{['Inicio','Presupuesto','Bandeja','Actividad','Cuentas','Reportes','Metas','Programadas','Por cobrar','Reglas','Notificaciones','Ajustes'].map((s) => <a key={s} href="#">{s}</a>)}</nav>
    <main id="contenido">{children}</main></body></html>);
}

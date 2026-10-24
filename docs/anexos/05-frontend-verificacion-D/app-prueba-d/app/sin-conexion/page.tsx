// /sin-conexion (05 §8.5): estática, sin datos, precacheada.
export const dynamic = 'force-static';
export const metadata = { title: 'Sin conexión · Finn' };
export default function SinConexion() {
  return (<main id="contenido" className="p-4"><h1 id="sin-conexion">Estás sin conexión</h1>
    <p>Finn necesita internet para mostrarte tus números al día.</p><a href="/">Intentar de nuevo</a></main>);
}

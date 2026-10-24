import { Monto } from '@/componentes/monto';
import { IndicadorEstado, type EstadoFinanciero } from '@/componentes/indicador-estado';
const ESTADOS: [EstadoFinanciero, string][] = [['positivo','Disponible'],['cero','Sin disponible'],['advertencia','Meta atrasada'],['problema','Sobregiro con débito o efectivo'],['deuda','Deuda de tarjeta'],['deuda-sin-respaldo','Deuda sin reservar'],['informacion','Información']];
export default async function Tokens({ searchParams }: { searchParams: Promise<{ tema?: string }> }) {
  const { tema } = await searchParams;
  return (
    <div className={tema === 'oscuro' ? 'dark' : ''}>
      <div className="min-h-screen bg-fondo text-texto p-4">
        <a href="#contenido" className="sr-only focus:not-sr-only">Saltar al contenido</a>
        <nav aria-label="Navegación principal"><a href="/base" className="text-enlace underline">Inicio</a></nav>
        <main id="contenido">
          <h1 className="text-2xl font-semibold">Tokens ({tema ?? 'claro'})</h1>
          <section className="bg-superficie border border-borde-sutil p-4 my-2">
            <p className="text-texto">Texto principal</p>
            <p className="text-texto-secundario">Texto secundario</p>
            <p className="text-texto-terciario">Texto terciario</p>
            <a href="/base" className="text-enlace underline">Un enlace</a>
          </section>
          <section className="bg-superficie-elevada p-4 my-2"><p className="text-texto-secundario">Sobre superficie elevada</p></section>
          <section className="bg-superficie-hundida p-4 my-2"><p className="text-texto-secundario">Sobre superficie hundida</p></section>
          <ul className="flex flex-wrap gap-2 my-2">
            {ESTADOS.map(([e, t]) => <li key={e}><IndicadorEstado estado={e} etiqueta={t} visible /></li>)}
          </ul>
          <ul>
            <li className="text-positivo-texto">Disponible</li><li className="text-cero-texto">Sin disponible</li><li className="text-advertencia-texto">Meta atrasada</li>
            <li className="text-problema-texto">Sobregiro</li><li className="text-deuda-texto">Deuda de tarjeta</li><li className="text-deuda-sin-respaldo-texto">Deuda sin reservar</li><li className="text-informacion-texto">Información</li>
          </ul>
          <p>Saldo: <Monto centavos={-123450} /> · Disponible: <Monto centavos={4567} tamano="grande" /></p>
          <div className="flex gap-2 my-2">
            <button className="bg-accion text-texto-sobre-accion px-4 min-h-11 rounded">Guardar</button>
            <button className="bg-accion-secundaria text-texto border border-borde-control px-4 min-h-11 rounded">Cancelar</button>
            <button className="bg-peligro text-texto-sobre-peligro px-4 min-h-11 rounded">Eliminar</button>
            <button disabled className="bg-superficie-hundida text-texto-deshabilitado px-4 min-h-11 rounded">Deshabilitado</button>
          </div>
          <label htmlFor="c" className="block">Monto</label>
          <input id="c" inputMode="decimal" className="border border-borde-control bg-superficie text-texto p-2 min-h-11" defaultValue="12.50" />
        </main>
      </div>
    </div>);
}

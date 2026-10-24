// Control negativo de V5-24: tres fallos a propósito que axe debe encontrar en los dos temas.
export default async function C({ searchParams }: { searchParams: Promise<{ tema?: string }> }) {
  const { tema } = await searchParams;
  return (<div className={tema === 'oscuro' ? 'dark' : ''}><main className="bg-fondo p-4"><h1 className="text-texto">Control</h1>
    <p className="text-texto-deshabilitado">Texto deshabilitado usado como texto normal</p>
    <button className="bg-accion"><svg width="16" height="16" aria-hidden="true" /></button>
    <input className="border border-borde-control" /></main></div>);
}

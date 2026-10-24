import { filas } from '../almacen';
import { Aplicar } from './aplicar';
export const dynamic = 'force-dynamic';
export default async function Pagina() {
  const todas = filas();
  const grupos = todas.filter((f) => f.tipo === 'grupo');
  return (<>
    <h1>Plantilla de categorías</h1>
    <p data-testid="creadas">{todas.length}</p>
    <Aplicar />
    {grupos.map((g) => (<section key={g.id}><h2>{g.nombre}</h2><ul>
      {todas.filter((c) => c.grupoId === g.id).map((c) => (<li key={c.id} data-id={c.id}>
        <span>{c.nombre}</span><span>Activa · sin meta · se puede eliminar · se puede archivar</span></li>))}
    </ul></section>))}
  </>);
}

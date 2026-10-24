import { Monto } from '@/componentes/monto';
import { IndicadorEstado } from '@/componentes/indicador-estado';
import { EnlaceFinn } from '@/componentes/enlace-finn';
export default function Base() {
  return (<main id="contenido" className="p-4"><h1 className="text-xl font-semibold">Base</h1>
    <p>Disponible: <Monto centavos={-123450} /></p>
    <IndicadorEstado estado="problema" etiqueta="Sobregiro con débito o efectivo" />
    <EnlaceFinn href="/tokens">Tokens</EnlaceFinn></main>);
}

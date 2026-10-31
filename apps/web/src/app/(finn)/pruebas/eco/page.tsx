// Flujo de prueba del patrón de escritura (TA-210; PRU-E2E-TX-001 a 003): solo con FINN_ENTORNO=pruebas. Muestra lo que el
// servidor guardó y recibió, para que la prueba lo lea. Textos de prueba, fuera del catálogo. Lo retira el primer flujo real.
import { almacenEco } from '../../../../servidor/eco.ts';
import { soloEnPruebas } from '../solo-pruebas.ts';
import { FormularioEco } from './formulario-eco.tsx';

// Sin prerender: `soloEnPruebas()` decide en cada petición, no con el entorno de la compilación (PRU-SEG-ACCESO-002).
export const dynamic = 'force-dynamic';

export default async function EcoDePrueba({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  soloEnPruebas();
  const { previa } = await searchParams;
  const { registros, idsRecibidos } = almacenEco();
  const ultimo = [...registros.values()].at(-1)?.texto ?? '';
  return (
    <main>
      <h1>{'Eco de prueba'}</h1>
      <p>{`Guardados: ${registros.size}`}</p>
      <p>{`Último: ${ultimo}`}</p>
      <p>{`Llamadas: ${idsRecibidos.length}`}</p>
      <p>{`Ids recibidos: ${idsRecibidos.join(',')}`}</p>
      <FormularioEco textoVisto={ultimo} previsualizarPrimero={previa === '1'} />
    </main>
  );
}

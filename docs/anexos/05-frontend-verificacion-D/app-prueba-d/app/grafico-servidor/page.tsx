import { GraficoBarras } from '@/componentes/grafico-barras';
const DATOS = [{ etiqueta: 'ene', centavos: 120000 }, { etiqueta: 'feb', centavos: 95050 }, { etiqueta: 'mar', centavos: 143000 }];
export default function Pagina() { return <main id="contenido" className="p-4"><h1>Gráfico en servidor</h1><GraficoBarras titulo="Gasto por mes" datos={DATOS} /></main>; }

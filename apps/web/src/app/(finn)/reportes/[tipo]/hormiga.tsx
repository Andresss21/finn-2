// El reporte `hormiga` (FT-64; 05 §2.10, 06 §3.5.8): las compras pequeñas y repetidas del período, por comercio o por categoría. Los
// hallazgos traen datos y el texto lo arma la pantalla; la acción «Ver las compras» abre Actividad con el período y el tope de
// monto (CA-24.3). Dibuja lo que trae el DTO: no calcula montos (PF-3). Sin grupos dice su estado de 06 FT-64.
import type { ReporteDe } from '@finn/aplicacion/consultas/reporte';
import { AvisoEnLinea } from '../../../../componentes/base/aviso';
import { COLOR_TEXTO } from '../../../../componentes/dominio/indicador-estado';
import { Monto } from '../../../../componentes/dominio/monto';
import { EnlaceFinn } from '../../../../componentes/navegacion/enlace-finn';
import { centavosATextoDecimal, formatearMonto } from '../../../../formato';
import { reportes as t } from '../../../../textos/reportes';
import { CifraReporte } from './cifra';
import { Tabla } from './vistas-detalle';

export type Hallazgo = ReporteDe<'hormiga'>['hallazgos'][number];
type Grupo = ReporteDe<'hormiga'>['grupos'][number];

const ENLACE =
  'inline-flex min-h-11 items-center gap-1.5 text-etiqueta font-bold no-underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

/** `/actividad` con las compras pequeñas del hallazgo (05 §2.2): por categoría con `categoria`, por comercio con `texto`. */
export function enlaceDeCompras(h: Hallazgo): string {
  const q = new URLSearchParams();
  if (h.enlace.categoriaId !== undefined) q.set('categoria', h.enlace.categoriaId);
  if (h.enlace.texto !== undefined) q.set('texto', h.enlace.texto);
  q.set('tipo', 'gasto');
  q.set('desde', h.enlace.desde);
  q.set('hasta', h.enlace.hasta);
  q.set('monto-hasta', centavosATextoDecimal(h.enlace.montoHasta));
  return `/actividad?${q.toString()}`;
}

function frase(h: Hallazgo): string {
  const total = formatearMonto(h.total);
  return h.agrupacion === 'categoria'
    ? t.hormiga.porCategoria(h.compras, h.etiqueta, total)
    : t.hormiga.porComercio(h.compras, h.etiqueta, total);
}

/** Un hallazgo de hormiga con su enlace a las compras; también lo dibuja el reporte `hallazgos`. */
export function AvisoHormiga({ hallazgo: h }: { readonly hallazgo: Hallazgo }) {
  return (
    <div data-hallazgo-hormiga={h.clave}>
      <AvisoEnLinea
        estado={h.estado}
        accion={
          <EnlaceFinn
            href={enlaceDeCompras(h)}
            className={[ENLACE, COLOR_TEXTO[h.estado]].join(' ')}
          >
            {t.hormiga.verCompras}
          </EnlaceFinn>
        }
      >
        {frase(h)}
      </AvisoEnLinea>
    </div>
  );
}

export function Hormiga({ dto }: { readonly dto: ReporteDe<'hormiga'> }) {
  if (dto.grupos.length === 0)
    return (
      <p data-sin-grupos className="text-cuerpo-pequeno text-texto-secundario">
        {t.hormiga.sinGrupos}
      </p>
    );
  return (
    <div className="flex flex-col gap-6">
      {dto.grupos[0] === undefined ? null : (
        <CifraReporte
          centavos={dto.grupos[0].total}
          frase={t.cifras.hormiga(dto.grupos[0].etiqueta)}
        />
      )}
      {dto.hallazgos.length === 0 ? null : (
        <div className="flex flex-col gap-2.5">
          {dto.hallazgos.map((h) => (
            <AvisoHormiga key={h.clave} hallazgo={h} />
          ))}
        </div>
      )}
      <section className="flex flex-col gap-2">
        <h3 className="text-titulo-seccion">{t.hormiga.grupos}</h3>
        <Tabla<Grupo>
          enfocable
          titulo={t.hormiga.grupos}
          clave={(g) => g.clave}
          filas={dto.grupos}
          columnas={[
            {
              id: 'grupo',
              celda: (g) => (
                <>
                  {g.etiqueta}
                  <span className="block text-cuerpo-pequeno font-normal text-texto-secundario">
                    {g.agrupacion === 'categoria' ? t.hormiga.deCategoria : t.hormiga.deComercio}
                  </span>
                </>
              ),
            },
            { id: 'compras', celda: (g) => g.compras },
            { id: 'total', celda: (g) => <Monto centavos={g.total} rol="cuerpo" /> },
          ]}
        />
      </section>
    </div>
  );
}

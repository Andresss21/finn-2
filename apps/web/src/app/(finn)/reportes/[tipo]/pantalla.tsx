// `/reportes/[tipo]` (FT-60; 05 §2.10, §7.2): navegación entre reportes y ventana como enlaces (`Pestanas`, 05 §10.7), y el reporte con
// su gráfico y su tabla equivalente. Dibuja lo que trae el DTO: no calcula montos (PF-3). Sin movimientos en la ventana:
// «No hay movimientos en estos períodos». `remanente` siempre con su título y su explicación (04 §6.9.5).
import type { ReporteDto } from '@finn/aplicacion/consultas/reporte';
import { Vacio } from '../../../../componentes/base/vacio';
import { PublicarEncabezado } from '../../../../componentes/marco/proveedor-encabezado';
import { Pestanas } from '../../../../componentes/navegacion/pestanas';
import { reportes as t } from '../../../../textos/reportes';
import { TIPOS, TIPOS_DE_URL, type TipoDeUrl } from './tipos';
import { cuerpoDe } from './vistas';

type Ventana = keyof typeof t.ventanas;
const VENTANAS = Object.keys(t.ventanas) as readonly Ventana[];

/** `ultimos_3` en el contrato, `ultimos-3` en la URL (05 §2.2); `actual` es la ventana por omisión y no lleva parámetro. */
const hrefDe = (url: TipoDeUrl, ventana: string): string =>
  ventana === 'actual'
    ? `/reportes/${url}`
    : `/reportes/${url}?ventana=${ventana.replace('_', '-')}`;

export function PantallaReporte({
  url,
  dto,
  ventana = 'actual',
}: {
  readonly url: TipoDeUrl;
  readonly dto: ReporteDto;
  /** La ventana ya validada por la consulta, en la forma del contrato. */
  readonly ventana?: string;
}) {
  const cuerpo = cuerpoDe(TIPOS[url], dto);
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-5 py-4">
      <PublicarEncabezado encabezado={dto} />
      <h1 className="text-titulo-pantalla">{t.titulo}</h1>
      <Pestanas
        etiqueta={t.titulo}
        pestanas={TIPOS_DE_URL.map((u) => ({
          id: u,
          etiqueta: t.pestanas[u],
          href: hrefDe(u, ventana),
        }))}
        activas={[url]}
      />
      <section data-reporte={TIPOS[url]} className="flex flex-col gap-4">
        <h2 className="text-titulo-seccion">{t.titulos[url]}</h2>
        {url === 'remanente' ? (
          <p data-explicacion className="text-cuerpo-pequeno text-texto-secundario">
            {t.explicacionRemanente}
          </p>
        ) : null}
        <Pestanas
          etiqueta={t.ventana}
          pestanas={VENTANAS.map((v) => ({ id: v, etiqueta: t.ventanas[v], href: hrefDe(url, v) }))}
          activas={[ventana]}
          marca="true"
        />
        {cuerpo === null ? (
          <Vacio titulo={t.sinMovimientos} texto={t.sinMovimientosTexto} icono="cero" />
        ) : (
          cuerpo
        )}
      </section>
    </main>
  );
}

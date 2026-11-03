// `/reportes/[tipo]` (FT-60; 05 §2.10, §7.2): navegación entre reportes y filtros como enlaces (`Pestanas`, 05 §10.7), y el reporte con
// su gráfico y su tabla equivalente. Dibuja lo que trae el DTO: no calcula montos (PF-3). Sin movimientos en la ventana:
// «No hay movimientos en estos períodos». `remanente` siempre con su título y su explicación (04 §6.9.5).
import type { ReporteDto } from '@finn/aplicacion/consultas/reporte';
import { Vacio } from '../../../../componentes/base/vacio';
import { PublicarEncabezado } from '../../../../componentes/marco/proveedor-encabezado';
import { Pestanas, type PestanaDeEnlace } from '../../../../componentes/navegacion/pestanas';
import { reportes as t } from '../../../../textos/reportes';
import { TIPOS, TIPOS_DE_URL, type TipoDeUrl } from './tipos';
import { cuerpoDe } from './vistas';
import type { Nombres } from './vistas-detalle';

export type { Nombres } from './vistas-detalle';

/** Lo que la URL pidió y la consulta aceptó: la ventana en la forma del contrato (`ultimos_3`) y el resto como texto. */
export type Parametros = Readonly<
  Partial<Record<'ventana' | 'cuentas' | 'grupo' | 'limite', string>>
>;

type Ventana = keyof typeof t.ventanas;
const VENTANAS = Object.keys(t.ventanas) as readonly Ventana[];
const LIMITES = ['5', '10', '20'] as const;
// Qué parámetros pasan de un reporte a otro: el grupo y el límite son de un solo reporte.
const COMPARTIDOS = ['ventana', 'cuentas'] as const;

/** La URL de un reporte con estos parámetros; `ultimos_3` va como `ultimos-3` (05 §2.2) y `actual` no lleva parámetro. */
function hrefDe(url: TipoDeUrl, p: Parametros, cambios: Parametros = {}): string {
  const q = new URLSearchParams();
  for (const [clave, valor] of Object.entries({ ...p, ...cambios })) {
    if (valor === '' || (clave === 'ventana' && valor === 'actual')) continue;
    q.set(clave, clave === 'ventana' ? valor.replace('_', '-') : valor);
  }
  const s = q.toString();
  return s === '' ? `/reportes/${url}` : `/reportes/${url}?${s}`;
}

interface Filtro {
  readonly etiqueta: string;
  readonly opciones: readonly PestanaDeEnlace[];
  readonly activas: readonly string[];
}

function filtrosDe(url: TipoDeUrl, p: Parametros, nombres: Nombres): Filtro[] {
  const elegidas = (p.cuentas ?? '').split(',').filter((id) => id !== '');
  const alternar = (id: string): string =>
    (elegidas.includes(id) ? elegidas.filter((x) => x !== id) : [...elegidas, id]).join(',');
  const filtros: Filtro[] = [
    {
      etiqueta: t.ventana,
      opciones: VENTANAS.map((v) => ({
        id: v,
        etiqueta: t.ventanas[v],
        href: hrefDe(url, p, { ventana: v }),
      })),
      activas: [p.ventana ?? 'actual'],
    },
    {
      etiqueta: t.filtros.cuentas,
      opciones: [
        { id: 'todas', etiqueta: t.filtros.todos, href: hrefDe(url, p, { cuentas: '' }) },
        ...nombres.cuentas.map((c) => ({
          id: c.id,
          etiqueta: c.nombre,
          href: hrefDe(url, p, { cuentas: alternar(c.id) }),
        })),
      ],
      activas: elegidas.length === 0 ? ['todas'] : elegidas,
    },
  ];
  if (url === 'categorias')
    filtros.push({
      etiqueta: t.filtros.grupo,
      opciones: [
        { id: 'todos', etiqueta: t.filtros.todos, href: hrefDe(url, p, { grupo: '' }) },
        ...nombres.grupos.map((g) => ({
          id: g.id,
          etiqueta: g.nombre,
          href: hrefDe(url, p, { grupo: g.id }),
        })),
      ],
      activas: [p.grupo ?? 'todos'],
    });
  if (url === 'top-comercios')
    filtros.push({
      etiqueta: t.filtros.limite,
      opciones: LIMITES.map((l) => ({ id: l, etiqueta: l, href: hrefDe(url, p, { limite: l }) })),
      activas: [p.limite ?? '10'],
    });
  return filtros;
}

export function PantallaReporte({
  url,
  dto,
  nombres,
  parametros,
}: {
  readonly url: TipoDeUrl;
  readonly dto: ReporteDto;
  readonly nombres: Nombres;
  readonly parametros: Parametros;
}) {
  const cuerpo = cuerpoDe(TIPOS[url], dto, nombres);
  const compartidos = Object.fromEntries(
    Object.entries(parametros).filter(([k]) => (COMPARTIDOS as readonly string[]).includes(k)),
  );
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-5 py-4">
      <PublicarEncabezado encabezado={dto} />
      <h1 className="text-titulo-pantalla">{t.titulo}</h1>
      <Pestanas
        etiqueta={t.titulo}
        pestanas={TIPOS_DE_URL.map((u) => ({
          id: u,
          etiqueta: t.pestanas[u],
          href: hrefDe(u, compartidos),
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
        <div className="flex flex-col gap-1">
          {filtrosDe(url, parametros, nombres).map((f) => (
            <Pestanas
              key={f.etiqueta}
              etiqueta={f.etiqueta}
              pestanas={f.opciones}
              activas={f.activas}
              marca="true"
            />
          ))}
        </div>
        {cuerpo === null ? (
          <Vacio titulo={t.sinMovimientos} texto={t.sinMovimientosTexto} icono="cero" />
        ) : (
          cuerpo
        )}
      </section>
    </main>
  );
}

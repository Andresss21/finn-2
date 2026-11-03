// `/reportes/[tipo]` (FT-60; 05 §2.10, §7.2): navegación entre reportes y filtros como enlaces (`Pestanas`, 05 §10.7), y el reporte
// con su gráfico y su tabla equivalente. Dibuja lo que trae el DTO: no calcula montos (PF-3). Sin movimientos en la ventana:
// «No hay movimientos en estos períodos». `remanente` siempre con su título y su explicación (04 §6.9.5).
import type { ReporteDto } from '@finn/aplicacion/consultas/reporte';
import { Vacio } from '../../../../componentes/base/vacio';
import { PublicarEncabezado } from '../../../../componentes/marco/proveedor-encabezado';
import { Pestanas, type PestanaDeEnlace } from '../../../../componentes/navegacion/pestanas';
import { reportes as t } from '../../../../textos/reportes';
import { TIPOS, TIPOS_DE_URL, type TipoDeUrl } from './tipos';
import { cuerpoDe, type Nombres } from './vistas';

export type { Nombres } from './vistas';

type Parametros = Readonly<Record<string, string>>;

const VENTANAS = ['actual', 'ultimos-1', 'ultimos-3', 'ultimos-6', 'ultimos-12'] as const;
const LIMITES = ['5', '10', '20'] as const;
// Qué parámetros pasan de un reporte a otro: el grupo y el límite son de un solo reporte.
const COMPARTIDOS = ['ventana', 'cuentas'] as const;

function hrefDe(url: TipoDeUrl, base: Parametros, cambios: Parametros = {}): string {
  const q = new URLSearchParams({ ...base, ...cambios });
  for (const [clave, valor] of Object.entries(cambios)) if (valor === '') q.delete(clave);
  const s = q.toString();
  return s === '' ? `/reportes/${url}` : `/reportes/${url}?${s}`;
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
  const compartidos = Object.fromEntries(
    Object.entries(parametros).filter(([k]) => (COMPARTIDOS as readonly string[]).includes(k)),
  );
  const elegidas = (parametros['cuentas'] ?? '').split(',').filter((id) => id !== '');
  const alternar = (id: string): string =>
    (elegidas.includes(id) ? elegidas.filter((x) => x !== id) : [...elegidas, id]).join(',');
  const cuerpo = cuerpoDe(TIPOS[url], dto, nombres);
  const pestanas: PestanaDeEnlace[] = TIPOS_DE_URL.map((u) => ({
    id: u,
    etiqueta: t.pestanas[u],
    href: hrefDe(u, compartidos),
  }));
  const ventanas: PestanaDeEnlace[] = VENTANAS.map((v) => ({
    id: v,
    etiqueta: t.filtros.ventanas[v.replace('-', '_') as keyof typeof t.filtros.ventanas],
    href: hrefDe(url, parametros, { ventana: v === 'actual' ? '' : v }),
  }));
  const filtros: {
    readonly etiqueta: string;
    readonly opciones: PestanaDeEnlace[];
    readonly activas: string[];
  }[] = [
    {
      etiqueta: t.filtros.ventana,
      opciones: ventanas,
      activas: [parametros['ventana'] ?? 'actual'],
    },
    {
      etiqueta: t.filtros.cuentas,
      opciones: [
        { id: 'todas', etiqueta: t.filtros.todos, href: hrefDe(url, parametros, { cuentas: '' }) },
        ...nombres.cuentas.map((c) => ({
          id: c.id,
          etiqueta: c.nombre,
          href: hrefDe(url, parametros, { cuentas: alternar(c.id) }),
        })),
      ],
      activas: elegidas.length === 0 ? ['todas'] : elegidas,
    },
  ];
  if (url === 'categorias')
    filtros.push({
      etiqueta: t.filtros.grupo,
      opciones: [
        { id: 'todos', etiqueta: t.filtros.todos, href: hrefDe(url, parametros, { grupo: '' }) },
        ...nombres.grupos.map((g) => ({
          id: g.id,
          etiqueta: g.nombre,
          href: hrefDe(url, parametros, { grupo: g.id }),
        })),
      ],
      activas: [parametros['grupo'] ?? 'todos'],
    });
  if (url === 'top-comercios')
    filtros.push({
      etiqueta: t.filtros.limite,
      opciones: LIMITES.map((l) => ({
        id: l,
        etiqueta: l,
        href: hrefDe(url, parametros, { limite: l }),
      })),
      activas: [parametros['limite'] ?? '10'],
    });
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-5 py-4">
      <PublicarEncabezado encabezado={dto} />
      <h1 className="text-titulo-pantalla">{t.titulo}</h1>
      <Pestanas etiqueta={t.navegacion} pestanas={pestanas} activas={[url]} />
      <section data-reporte={TIPOS[url]} className="flex flex-col gap-4">
        <h2 className="text-titulo-seccion">{t.titulos[url]}</h2>
        {url === 'remanente' ? (
          <p data-explicacion className="text-cuerpo-pequeno text-texto-secundario">
            {t.explicacionRemanente}
          </p>
        ) : null}
        <div className="flex flex-col gap-1">
          {filtros.map((f) => (
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

// `/reportes/[tipo]` (FT-60; 05 §2.10, §7.2): navegación entre reportes y filtros como enlaces (`Pestanas`, 05 §10.7), y el reporte con
// su gráfico y su tabla equivalente. Dibuja lo que trae el DTO: no calcula montos (PF-3). Sin movimientos en la ventana:
// «No hay movimientos en estos períodos». `remanente` siempre con su título y su explicación (04 §6.9.5).
import type { ReporteDe, ReporteDto } from '@finn/aplicacion/consultas/reporte';
import { Vacio } from '../../../../componentes/base/vacio';
import { EnlaceFinn } from '../../../../componentes/navegacion/enlace-finn';
import { PublicarEncabezado } from '../../../../componentes/marco/proveedor-encabezado';
import { Pestanas, type PestanaDeEnlace } from '../../../../componentes/navegacion/pestanas';
import type { AccionEscritura } from '../../../../formularios/use-operacion';
import { SelectorPeriodo } from '../../../../componentes/navegacion/selector-periodo';
import { reportes as t } from '../../../../textos/reportes';
import { TIPOS, TIPOS_DE_URL, type TipoDeUrl } from './tipos';
import type { AccionesRealidad } from './realidad-hallazgos';
import type { AccionesSuscripciones } from './suscripciones-hallazgos';
import { cuerpoDe } from './vistas';
import type { Nombres } from './vistas-detalle';

export type { Nombres } from './vistas-detalle';

/** Lo que la URL pidió y la consulta aceptó: la ventana en la forma del contrato (`ultimos_3`) y el resto como texto. */
export type Parametros = Readonly<
  Partial<Record<'ventana' | 'cuentas' | 'grupo' | 'limite' | 'periodo' | 'categorias', string>>
>;

type Ventana = keyof typeof t.ventanas;
const VENTANAS = Object.keys(t.ventanas) as readonly Ventana[];
const LIMITES = ['5', '10', '20'] as const;
// Qué parámetros pasan de un reporte a otro: el grupo y el límite son de un solo reporte.
const COMPARTIDOS = ['ventana', 'cuentas'] as const;

/** La ventana que la consulta usa sin `?ventana=`: `ultimos_6` en `tarjetas` (04 §6.9.3) y `actual` en los demás. */
const predeterminada = (url: TipoDeUrl): Ventana => (url === 'tarjetas' ? 'ultimos_6' : 'actual');

/** La URL de un reporte con estos parámetros; `ultimos_3` va como `ultimos-3` (05 §2.2) y la ventana predeterminada no lleva parámetro. */
function hrefDe(url: TipoDeUrl, p: Parametros, cambios: Parametros = {}): string {
  const q = new URLSearchParams();
  for (const [clave, valor] of Object.entries({ ...p, ...cambios })) {
    if (valor === '' || (clave === 'ventana' && valor === predeterminada(url))) continue;
    q.set(clave, clave === 'ventana' ? valor.replace('_', '-') : valor);
  }
  const s = q.toString();
  return s === '' ? `/reportes/${url}` : `/reportes/${url}?${s}`;
}

// Clases literales (L13): el botón tonal del estado vacío, de 48 px.
const ACCION_VACIO =
  'inline-flex min-h-12 items-center justify-center rounded-control bg-accion-tonal px-5 font-semibold text-accion focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

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
      activas: [p.ventana ?? predeterminada(url)],
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

/** Las categorías para marcar: las del DTO y las que el árbol trae; cada enlace agrega o quita una. */
function categoriasDe(
  dto: ReporteDe<'gasto_semanal'>,
  p: Parametros,
  nombres: Nombres,
): PestanaDeEnlace[] {
  const elegidas = dto.categorias.map((c) => c.categoria);
  return nombres.categorias.map((c) => {
    const quedan = elegidas.includes(c.id)
      ? elegidas.filter((x) => x !== c.id)
      : [...elegidas, c.id];
    return {
      id: c.id,
      etiqueta: c.nombre,
      href: hrefDe('gasto-semanal', p, { categorias: quedan.join(',') }),
    };
  });
}

export function PantallaReporte({
  url,
  dto,
  nombres,
  parametros,
  asignar,
  realidad,
  suscripciones,
}: {
  readonly url: TipoDeUrl;
  readonly dto: ReporteDto;
  readonly nombres: Nombres;
  readonly parametros: Parametros;
  /** `asignarEnCategoria` (OP-14): la propuesta de un toque de `ritmo`; la pone el lector. */
  readonly asignar?: AccionEscritura;
  /** Los ajustes de un toque de `realidad` (OP-14 y OP-18) con lo vigente que vio la pantalla; los pone el lector. */
  readonly realidad?: AccionesRealidad;
  /** Las acciones de un toque de `suscripciones` (OP-42 y OP-51); las pone el lector. */
  readonly suscripciones?: AccionesSuscripciones;
}) {
  const cuerpo = cuerpoDe(TIPOS[url], dto, nombres, asignar, realidad, suscripciones);
  const compartidos = Object.fromEntries(
    Object.entries(parametros).filter(([k]) => (COMPARTIDOS as readonly string[]).includes(k)),
  );
  const semanal = url === 'gasto-semanal' ? (dto as ReporteDe<'gasto_semanal'>) : null;
  // `hormiga` también elige un período (`?periodo=`) y se filtra solo por cuentas.
  const deHormiga = url === 'hormiga' ? (dto as ReporteDe<'hormiga'>) : null;
  const conPeriodo = semanal ?? deHormiga;
  // `ritmo`, `realidad` y `hallazgos` miran el período activo y `suscripciones` los 4 cerrados (05 §2.10): ninguno lleva ventana ni cuentas.
  const delActivo =
    url === 'ritmo' || url === 'realidad' || url === 'hallazgos' || url === 'suscripciones';
  const todos = semanal === null && !delActivo ? filtrosDe(url, parametros, nombres) : [];
  // `hormiga` elige su período con el selector: no lleva la ventana, solo las cuentas.
  const [primero, ...otros] = todos;
  const ventana = deHormiga === null ? primero : undefined;
  // Sin movimientos, la salida del diseño es mirar más períodos; si ya se miran 3 o más, no hay a dónde ampliar.
  const efectiva = parametros.ventana ?? predeterminada(url);
  const ampliar = efectiva === 'ultimos_3' || efectiva === 'ultimos_6' || efectiva === 'ultimos_12';
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-4 md:max-w-6xl">
      <PublicarEncabezado encabezado={dto} />
      <h1 className="text-titulo-pantalla">{t.titulo}</h1>
      <div className="-mx-5 px-5">
        <Pestanas
          etiqueta={t.titulo}
          variante="tinta"
          pestanas={TIPOS_DE_URL.map((u) => ({
            id: u,
            etiqueta: t.pestanas[u],
            href: hrefDe(u, compartidos),
          }))}
          activas={[url]}
        />
      </div>
      <section
        data-reporte={TIPOS[url]}
        className="flex flex-col gap-6 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] md:items-start md:gap-10"
      >
        <div data-reporte-filtros className="flex flex-col gap-5">
          <h2 className="text-titulo-seccion">{t.titulos[url]}</h2>
          {url === 'flujo-efectivo' ? (
            <p data-explicacion className="text-cuerpo-pequeno text-texto-secundario">
              {t.explicacionFlujo}
            </p>
          ) : null}
          {url === 'remanente' ? (
            <p data-explicacion className="text-cuerpo-pequeno text-texto-secundario">
              {t.explicacionRemanente}
            </p>
          ) : null}
          {conPeriodo === null ? null : (
            <SelectorPeriodo
              periodo={conPeriodo.periodo}
              periodoActivo={dto.periodoActivo}
              {...(conPeriodo.navegacion.anterior === undefined
                ? {}
                : { anterior: conPeriodo.navegacion.anterior })}
              {...(conPeriodo.navegacion.siguiente === undefined
                ? {}
                : { siguiente: conPeriodo.navegacion.siguiente })}
              ruta={`/reportes/${url}`}
              parametros={{
                ...(parametros.categorias === undefined
                  ? {}
                  : { categorias: parametros.categorias }),
                ...(parametros.cuentas === undefined ? {} : { cuentas: parametros.cuentas }),
              }}
            />
          )}
          {semanal === null ? null : (
            <>
              <Pestanas
                etiqueta={t.gastoSemanal.categorias}
                pestanas={categoriasDe(semanal, parametros, nombres)}
                activas={semanal.categorias.map((c) => c.categoria)}
                marca="true"
              />
            </>
          )}
          {ventana === undefined ? null : (
            <div className="flex flex-col gap-1.5">
              <span className="text-etiqueta text-texto">{ventana.etiqueta}</span>
              <Pestanas
                etiqueta={ventana.etiqueta}
                pestanas={ventana.opciones}
                activas={ventana.activas}
                marca="true"
                variante="segmento"
              />
            </div>
          )}
          <div className="flex flex-col gap-1">
            {otros.map((f) => (
              <Pestanas
                key={f.etiqueta}
                etiqueta={f.etiqueta}
                pestanas={f.opciones}
                activas={f.activas}
                marca="true"
              />
            ))}
          </div>
        </div>
        {cuerpo === null ? (
          <Vacio
            titulo={t.sinMovimientos}
            texto={t.sinMovimientosTexto}
            icono="cero"
            {...(ampliar
              ? {}
              : {
                  accion: (
                    <EnlaceFinn
                      href={hrefDe(url, parametros, { ventana: 'ultimos_3' })}
                      className={ACCION_VACIO}
                    >
                      {t.verVentana(t.ventanas.ultimos_3)}
                    </EnlaceFinn>
                  ),
                })}
          />
        ) : (
          <div className="min-w-0">{cuerpo}</div>
        )}
      </section>
    </main>
  );
}

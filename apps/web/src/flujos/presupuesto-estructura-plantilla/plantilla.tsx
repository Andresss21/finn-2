'use client';
// `/presupuesto/estructura/plantilla` (FT-04; 06 §3.9; CF-08, CF-19): la lista se edita y nada se guarda hasta "Crear". Se aplica con
// OP-07 en lote, en tandas. Los ids de creación van al borrador de la pestaña (05 §4.11) antes de la primera tanda: si se corta, al
// volver se reenvían los que no tienen resultado con los mismos ids (lo ya creado responde `ya_aplicada`). No calcula montos (PF-3).
import type { SalidaOp07Lote } from '@finn/aplicacion/contratos';
import { useEffect, useRef, useState } from 'react';
import { almacen } from '../../cliente/almacen';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { EntradaSinEtiqueta } from '../../componentes/base/campo';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { CerrarFlujoAlMontar, PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { claveDeBorrador } from '../../formularios/use-borrador';
import type { AccionEscritura } from '../../formularios/use-operacion';
import { plantilla as t } from '../../textos/plantilla';
import { retomarPorNombre, type Existente } from './reanudar';
import { tandas } from './tandas';

const RAIZ = '/presupuesto/estructura';
const CLAVE = claveDeBorrador(`${RAIZ}/plantilla`);
const ENLACE = 'inline-flex min-h-11 items-center px-3 font-semibold text-enlace underline';

interface Fila {
  readonly clave: string;
  readonly padre: string | null;
  readonly nombre: string;
}
interface Elemento {
  readonly id: string;
  readonly tipo: 'grupo' | 'categoria';
  readonly nombre: string;
  readonly grupoId?: string;
}
// `resultados`, por id de creación: `null` si quedó creado (o ya lo estaba) o el mensaje de su rechazo.
interface Aplicacion {
  readonly elementos: readonly Elemento[];
  readonly resultados: Record<string, string | null>;
}
type Fase = 'leyendo' | 'saliendo' | 'editando' | 'aplicando' | 'pendiente' | 'resumen';

let contador = 0;
const clave = (): string => `f${(contador += 1)}`;
const inicial = (): Fila[] =>
  t.grupos.flatMap((g) => {
    const padre = clave();
    return [
      { clave: padre, padre: null, nombre: g.nombre },
      ...g.categorias.map((nombre) => ({ clave: clave(), padre, nombre })),
    ];
  });
const limpio = (f: Fila): string => f.nombre.trim();
const hijas = (filas: readonly Fila[], g: Fila): Fila[] =>
  filas.filter((c) => c.padre === g.clave && limpio(c) !== '');
const conNombre = (filas: readonly Fila[]): Fila[] =>
  filas.filter((g) => g.padre === null && limpio(g) !== '');

/** Los elementos en el orden de aplicación: cada grupo y, enseguida, sus categorías. */
const armar = (filas: readonly Fila[]): Elemento[] =>
  conNombre(filas).flatMap((g) => {
    const id = crypto.randomUUID();
    const categorias = hijas(filas, g).map((c): Elemento => ({
      id: crypto.randomUUID(),
      tipo: 'categoria',
      nombre: limpio(c),
      grupoId: id,
    }));
    return [{ id, tipo: 'grupo', nombre: limpio(g) } satisfies Elemento, ...categorias];
  });

function leerGuardado(): Aplicacion | null {
  try {
    const g = JSON.parse(almacen.leer(CLAVE) ?? 'null') as { campos?: Aplicacion } | null;
    return Array.isArray(g?.campos?.elementos) ? g.campos : null;
  } catch {
    return null;
  }
}
const guardar = (campos: Aplicacion): void => {
  almacen.escribir(CLAVE, JSON.stringify({ version: 1, campos }));
};

function FilaNombre({
  fila,
  etiqueta,
  etiquetaQuitar,
  alCambiar,
  alQuitar,
}: {
  readonly fila: Fila;
  readonly etiqueta: string;
  readonly etiquetaQuitar: string;
  readonly alCambiar: (clave: string, nombre: string) => void;
  readonly alQuitar: (clave: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <EntradaSinEtiqueta
        className="min-w-0 flex-1"
        data-clave={fila.clave}
        aria-label={etiqueta}
        value={fila.nombre}
        onChange={(e) => {
          alCambiar(fila.clave, e.target.value);
        }}
      />
      <Boton
        variante="discreta"
        aria-label={etiquetaQuitar}
        onClick={() => {
          alQuitar(fila.clave);
        }}
      >
        {t.quitar}
      </Boton>
    </div>
  );
}

export function PanelPlantilla(props: {
  hayNormales: boolean;
  existentes?: readonly Existente[];
  crearLote: AccionEscritura;
}) {
  const { hayNormales, existentes = [], crearLote } = props;
  const [fase, setFase] = useState<Fase>('leyendo');
  const [filas, setFilas] = useState<Fila[]>(inicial);
  const [aplicacion, setAplicacion] = useState<Aplicacion>({ elementos: [], resultados: {} });
  const [fallo, setFallo] = useState<string | null>(null);
  const [enfocar, setEnfocar] = useState<string | null>(null);
  const leido = useRef(false);

  // Tras montar: una aplicación a medias se retoma; con categorías normales y sin ella, la plantilla ya no corresponde.
  useEffect(() => {
    if (leido.current) return;
    leido.current = true;
    // Sin borrador (otra pestaña, almacenamiento no disponible), lo ya creado se reconoce por nombre (3.9.1).
    const guardado = leerGuardado() ?? (hayNormales ? retomarPorNombre(existentes) : null);
    if (guardado !== null) {
      guardar(guardado);
      setAplicacion(guardado);
      setFase('pendiente');
    } else setFase(hayNormales ? 'saliendo' : 'editando');
  }, [hayNormales, existentes]);
  useEffect(() => {
    if (enfocar === null) return;
    document.querySelector<HTMLInputElement>(`[data-clave="${enfocar}"]`)?.focus();
    setEnfocar(null);
  }, [enfocar]);

  const renombrar = (k: string, nombre: string): void => {
    setFilas((fs) => fs.map((f) => (f.clave === k ? { ...f, nombre } : f)));
  };
  const quitar = (k: string): void => {
    setFilas((fs) => fs.filter((f) => f.clave !== k && f.padre !== k));
  };
  const agregarA = (padre: string | null) => (): void => {
    const nueva = { clave: clave(), padre, nombre: '' };
    setFilas((fs) => [...fs, nueva]);
    setEnfocar(nueva.clave);
  };

  /** Envía las tandas que faltan, una llamada por tanda, y guarda cada resultado antes de seguir. */
  const correr = async (actual: Aplicacion): Promise<void> => {
    setFase('aplicando');
    setFallo(null);
    const resultados = { ...actual.resultados };
    setAplicacion({ elementos: actual.elementos, resultados });
    const faltan = actual.elementos.filter((e) => !(e.id in resultados));
    for (const tanda of tandas(faltan, actual.elementos.length)) {
      // Si un grupo falló en una tanda anterior, sus categorías no se intentan: llevan el motivo del grupo (CA-04.13).
      const enviar = tanda.filter((e) => {
        const motivo = e.grupoId === undefined ? null : resultados[e.grupoId];
        if (typeof motivo === 'string') resultados[e.id] = motivo;
        return typeof motivo !== 'string';
      });
      let mensaje: string | null = null;
      try {
        const r =
          enviar.length === 0 ? null : await crearLote({ modo: 'confirmar', elementos: enviar });
        if (r?.ok === true)
          for (const e of (r.valor as SalidaOp07Lote).elementos)
            resultados[e.id] = typeof e.resultado === 'string' ? null : e.resultado.mensaje;
        else if (r !== null) mensaje = r.error.mensaje;
      } catch {
        mensaje = t.sinConexion;
      }
      if (mensaje !== null) {
        setFallo(mensaje);
        setFase('pendiente');
        return;
      }
      const siguiente = { elementos: actual.elementos, resultados: { ...resultados } };
      guardar(siguiente);
      setAplicacion(siguiente);
    }
    almacen.borrar(CLAVE);
    setFase('resumen');
  };
  const seguir = (): void => {
    void correr(aplicacion);
  };
  const crear = (): void => {
    const nueva = { elementos: armar(filas), resultados: {} };
    guardar(nueva); // antes de la primera tanda (CF-19)
    void correr(nueva);
  };

  const categorias = conNombre(filas).reduce((n, g) => n + hijas(filas, g).length, 0);
  const hechos = Object.keys(aplicacion.resultados).length;
  const total = aplicacion.elementos.length;
  const rechazados = aplicacion.elementos.flatMap((e) => {
    const motivo = aplicacion.resultados[e.id];
    return typeof motivo === 'string' ? [{ id: e.id, texto: t.noSeCreo(e.nombre, motivo) }] : [];
  });

  return (
    <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre={RAIZ}>
      <div className="flex flex-col gap-4">
        {fase === 'saliendo' ? <CerrarFlujoAlMontar rutaPadre={RAIZ} /> : null}
        {fase === 'editando' ? (
          <>
            <p className="text-cuerpo-pequeno text-texto-secundario">{t.descripcion}</p>
            {filas
              .filter((g) => g.padre === null)
              .map((g) => {
                const nombre = limpio(g) === '' ? t.grupoNuevo : limpio(g);
                return (
                  <div key={g.clave} className="flex flex-col gap-2">
                    <FilaNombre
                      fila={g}
                      etiqueta={t.nombreGrupo(nombre)}
                      etiquetaQuitar={t.quitarGrupo(nombre)}
                      alCambiar={renombrar}
                      alQuitar={quitar}
                    />
                    <ul className="flex flex-col gap-2 pl-4">
                      {filas
                        .filter((c) => c.padre === g.clave)
                        .map((c) => {
                          const propio = limpio(c) === '' ? t.categoriaNueva : limpio(c);
                          return (
                            <li key={c.clave}>
                              <FilaNombre
                                fila={c}
                                etiqueta={t.nombreCategoria(propio)}
                                etiquetaQuitar={t.quitarCategoria(propio)}
                                alCambiar={renombrar}
                                alQuitar={quitar}
                              />
                            </li>
                          );
                        })}
                    </ul>
                    <div>
                      <Boton
                        variante="discreta"
                        aria-label={t.agregarCategoria(nombre)}
                        onClick={agregarA(g.clave)}
                      >
                        {t.agregar}
                      </Boton>
                    </div>
                  </div>
                );
              })}
            <div>
              <Boton variante="secundaria" onClick={agregarA(null)}>
                {t.agregarGrupo}
              </Boton>
            </div>
            <Boton
              deshabilitado={categorias === 0}
              motivoDeshabilitado={t.elegirUna}
              onClick={crear}
            >
              {t.crear(categorias)}
            </Boton>
          </>
        ) : null}
        {fase === 'aplicando' ? <p role="status">{t.creando(hechos, total)}</p> : null}
        {fase === 'pendiente' ? (
          <>
            <AvisoEnLinea estado="advertencia" aparecioDespues>
              {fallo ?? t.seInterrumpio}
            </AvisoEnLinea>
            <Boton onClick={seguir}>{t.seguir(hechos, total)}</Boton>
          </>
        ) : null}
        {fase === 'resumen' ? (
          <div role="status" className="flex flex-col gap-3">
            <p>{t.creadas(total - rechazados.length)}</p>
            {rechazados.length === 0 ? null : <p>{t.noSeCrearon(rechazados.length)}</p>}
            <ul className="list-disc pl-6">
              {rechazados.map((r) => (
                <li key={r.id}>{r.texto}</li>
              ))}
            </ul>
            <EnlaceFinn href="/presupuesto" className={ENLACE}>
              {t.verPresupuesto}
            </EnlaceFinn>
          </div>
        ) : null}
      </div>
    </PaginaFlujoDeRuta>
  );
}

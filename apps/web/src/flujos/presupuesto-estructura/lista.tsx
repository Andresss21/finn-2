'use client';
// `/presupuesto/estructura` (FT-18; 05 §2.3, §4.14): la lista de grupos y categorías con sus enlaces de alta y edición. [CH-272]
// C-46: los grupos se colapsan (recordado en el dispositivo) y el asa abre la barra «Mover», que manda un OP-08 por toque con
// `orden` (y `grupoId` al cruzar de grupo). La lista muestra el lugar nuevo mientras espera y, si OP-08 rechaza, vuelve al anterior
// con el error en línea. Un solo resultado a la vez, debajo de lo que se movió o creó; nunca se va solo (principio 5). El orden
// nunca depende de arrastrar (WCAG 2.5.7). No calcula montos: los lugares salen del árbol de `estructura()` (`lugares.ts`).
import type { ResultadoAccion } from '@finn/aplicacion/errores';
import type { GrupoDeEstructura } from '@finn/dominio/selectores';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useColapsados } from '../../cliente/useColapsados';
import { Boton } from '../../componentes/base/boton';
import { Icono } from '../../componentes/base/icono';
import { Resultado } from '../../componentes/base/resultado';
import { Vacio } from '../../componentes/base/vacio';
import { PaginaFlujoDeRuta, useCerrarFlujo } from '../../componentes/navegacion/flujo-de-ruta';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { useOperacion } from '../../formularios/use-operacion';
import { editarEnEstructura } from '../../servidor/acciones/categorias';
import { estructura as t } from '../../textos/estructura';
import { formularios } from '../../textos/formularios';
import { Archivadas } from './archivadas';
import { BarraMover } from './barra-mover';
import { GrupoEstructura, GrupoSistema } from './grupo';
import * as L from './lugares';
import type { ResultadoEstructura } from './resultado';

const RAIZ = '/presupuesto/estructura';
const CLAVE = 'finn.colapsados.estructura';
const PRINCIPAL =
  'inline-flex min-h-12 items-center rounded-control bg-accion px-5 font-semibold text-texto-sobre-accion focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

type Aviso =
  | { readonly tipo: 'creado'; readonly r: ResultadoEstructura }
  | {
      readonly tipo: 'movido';
      readonly ancla: string;
      readonly texto: string;
      /** El árbol de antes y el OP-08 que lo devuelve: «Deshacer». */
      readonly volver?: {
        readonly antes: L.Arbol;
        readonly entrada: L.EntradaMover;
        readonly texto: string;
      };
    }
  | { readonly tipo: 'error'; readonly ancla: string; readonly texto: string };

const aArbol = (gs: readonly GrupoDeEstructura[]): L.Arbol =>
  gs.map(({ grupo, categorias }) => ({
    id: grupo.id,
    nombre: grupo.nombre,
    archivado: grupo.archivado,
    sistema: grupo.sistema,
    categorias: categorias.map((c) => ({
      id: c.categoria.id,
      nombre: c.categoria.nombre,
      archivada: c.archivada,
    })),
  }));

export function ListaEstructura({
  grupos: todos,
  resultado,
}: {
  readonly grupos: readonly GrupoDeEstructura[];
  /** [CH-270] Lo que dejó crear un grupo o una categoría (`?resultado=`, ya validado). */
  readonly resultado?: ResultadoEstructura;
}) {
  // El árbol del servidor manda; mientras OP-08 viaja, la lista muestra el lugar nuevo.
  const [base, setBase] = useState(todos);
  const [arbol, setArbol] = useState<L.Arbol>(() => aArbol(todos));
  if (base !== todos) {
    setBase(todos);
    setArbol(aArbol(todos));
  }
  const clave = resultado === undefined ? '' : `${resultado.tipo}:${resultado.id}`;
  const [claveVista, setClaveVista] = useState(clave);
  const [aviso, setAviso] = useState<Aviso | null>(
    resultado === undefined ? null : { tipo: 'creado', r: resultado },
  );
  if (clave !== claveVista) {
    setClaveVista(clave);
    if (resultado !== undefined) setAviso({ tipo: 'creado', r: resultado });
    else if (aviso?.tipo === 'creado') setAviso(null);
  }
  const [barra, setBarra] = useState<{ readonly id: string; readonly otro: boolean } | null>(null);
  const [anuncio, setAnuncio] = useState('');
  const { colapsados, guardar } = useColapsados(CLAVE);
  const usuarios = L.usuarios(arbol);
  const guardarDe = (ids: Iterable<string>) => {
    const vivos = new Set(usuarios.map((g) => g.id));
    guardar([...ids].filter((x) => vivos.has(x)));
  };

  // El foco nunca se pierde (§6): después de mover, vuelve al botón tocado aunque la fila haya cambiado de grupo.
  const enfocar = useRef<string | null>(null);
  useEffect(() => {
    const f = enfocar.current;
    if (f === null) return;
    enfocar.current = null;
    const e = document.querySelector<HTMLElement>(`[data-foco="${f}"]`);
    if (e !== null && document.activeElement !== e) e.focus();
  });
  useEffect(() => {
    if (aviso?.tipo !== 'creado') return;
    // Si el panel devolvió el foco a su disparador («Nueva categoría» o «Nuevo grupo», junto al resultado), queda ahí.
    const espera = setTimeout(() => {
      const activo = document.activeElement;
      if (activo === null || activo === document.body)
        document.querySelector<HTMLElement>('[data-foco="aviso"]')?.focus();
    }, 0);
    return () => {
      clearTimeout(espera);
    };
  }, [aviso, claveVista]);

  const ultimo = useRef<ResultadoAccion<unknown> | null>(null);
  const llamar = useCallback(async (e: unknown) => {
    const r = await editarEnEstructura(e);
    ultimo.current = r;
    return r;
  }, []);
  const op = useOperacion({ accion: llamar });
  const enVuelo = useRef(false);
  /** Un OP-08: el lugar nuevo enseguida; con `ok`, el resultado; si no, el lugar de antes y el error debajo de la fila. */
  const enviar = async (
    entrada: L.EntradaMover,
    antes: L.Arbol,
    despues: L.Arbol,
    exito: Aviso,
    foco: string,
  ) => {
    if (enVuelo.current) return;
    enVuelo.current = true;
    setArbol(despues);
    setAviso(null);
    enfocar.current = foco;
    ultimo.current = null;
    try {
      await op.enviar(entrada);
    } finally {
      enVuelo.current = false;
    }
    const r = ultimo.current as ResultadoAccion<unknown> | null;
    if (r?.ok === true) {
      setAviso(exito);
      return;
    }
    setArbol(antes);
    const texto =
      r === null
        ? navigator.onLine
          ? formularios.incierto
          : formularios.sinConexion
        : r.error.mensaje;
    setAviso({ tipo: 'error', ancla: entrada.id, texto });
  };
  const aplicar = (m: L.Movimiento | undefined, id: string, foco: string) => {
    if (m === undefined) return;
    void enviar(
      m.entrada,
      arbol,
      m.despues,
      {
        tipo: 'movido',
        ancla: id,
        texto: m.texto,
        volver: { antes: arbol, entrada: m.inversa, texto: m.volvio },
      },
      foco,
    );
  };
  /** Mover una categoría a un lugar (la barra hoy; el arrastre en el PR siguiente). El grupo de destino se abre. */
  const moverCategoria = (cid: string, destino: L.Lugar | undefined, foco: string) => {
    if (destino === undefined) return;
    if (colapsados.has(destino.grupoId))
      guardarDe([...colapsados].filter((x) => x !== destino.grupoId));
    aplicar(L.moverCategoria(arbol, cid, destino), cid, foco);
  };
  const moverGrupo = (gid: string, idx: number | undefined, foco: string) => {
    if (idx !== undefined) aplicar(L.moverGrupo(arbol, gid, idx), gid, foco);
  };

  const alternar = (g: L.GrupoVista) => {
    const cerrado = colapsados.has(g.id);
    guardarDe(cerrado ? [...colapsados].filter((x) => x !== g.id) : [...colapsados, g.id]);
    setAnuncio((cerrado ? t.expandiste : t.colapsaste)(g.nombre));
  };
  const todosCerrados = usuarios.length > 0 && usuarios.every((g) => colapsados.has(g.id));
  const tocarAsa = (tipo: 'grupo' | 'categoria', id: string) => {
    if (barra?.id === id) {
      setBarra(null);
      setAnuncio(t.barraCerrada);
      return;
    }
    setBarra({ id, otro: false });
    setAnuncio(tipo === 'grupo' ? L.estadoGrupo(arbol, id) : L.anuncioCategoria(arbol, id));
    enfocar.current = `subir-${id}`;
  };

  const resultadoEn = (texto: string, volver?: () => void) => (
    <div
      data-aviso
      data-foco="aviso"
      role="status"
      tabIndex={-1}
      className="fz-resultado border-b border-borde-sutil bg-positivo-fondo focus-visible:outline-3 focus-visible:outline-foco"
    >
      <Resultado
        texto={texto}
        {...(volver === undefined ? {} : { salida: { etiqueta: t.deshacer, ejecutar: volver } })}
        alCerrar={() => {
          setAviso(null);
        }}
      />
    </div>
  );
  /** Lo que va debajo de una fila o de un encabezado: su barra «Mover» y el resultado o el error. */
  const enLugar = (id: string): ReactNode => {
    const esGrupo = usuarios.some((g) => g.id === id);
    const cuerpo: ReactNode[] = [];
    if (barra?.id === id) {
      const cerrar = () => {
        setBarra(null);
        setAnuncio(t.barraCerrada);
        enfocar.current = `asa-${id}`;
      };
      const grupoActual = L.lugarDeCategoria(arbol, id)?.grupo.id;
      cuerpo.push(
        esGrupo ? (
          <BarraMover
            key="barra"
            id={id}
            nombre={usuarios.find((g) => g.id === id)?.nombre ?? ''}
            esGrupo
            estado={L.estadoGrupo(arbol, id)}
            listo={cerrar}
            subir={
              L.vecinoDeGrupo(arbol, id, -1) === undefined
                ? undefined
                : () => {
                    moverGrupo(id, L.vecinoDeGrupo(arbol, id, -1), `subir-${id}`);
                  }
            }
            bajar={
              L.vecinoDeGrupo(arbol, id, 1) === undefined
                ? undefined
                : () => {
                    moverGrupo(id, L.vecinoDeGrupo(arbol, id, 1), `bajar-${id}`);
                  }
            }
          />
        ) : (
          <BarraMover
            key="barra"
            id={id}
            nombre={
              L.lugarDeCategoria(arbol, id)?.grupo.categorias.find((c) => c.id === id)?.nombre ?? ''
            }
            esGrupo={false}
            estado={L.estadoCategoria(arbol, id)}
            listo={cerrar}
            subir={
              L.vecino(arbol, id, -1) === undefined
                ? undefined
                : () => {
                    moverCategoria(id, L.vecino(arbol, id, -1), `subir-${id}`);
                  }
            }
            bajar={
              L.vecino(arbol, id, 1) === undefined
                ? undefined
                : () => {
                    moverCategoria(id, L.vecino(arbol, id, 1), `bajar-${id}`);
                  }
            }
            otro={{
              abierto: barra.otro,
              alternar: () => {
                setBarra({ id, otro: !barra.otro });
              },
              grupos: usuarios.filter((g) => g.id !== grupoActual),
              elegir: (gid) => {
                setBarra({ id, otro: false });
                const g = usuarios.find((x) => x.id === gid);
                moverCategoria(
                  id,
                  { grupoId: gid, idx: g?.categorias.filter((c) => !c.archivada).length ?? 0 },
                  `otro-${id}`,
                );
              },
            }}
          />
        ),
      );
    }
    if (aviso?.tipo === 'error' && aviso.ancla === id)
      cuerpo.push(
        <p
          key="error"
          role="alert"
          className="text-cuerpo-pequeno flex items-center gap-2 px-4 py-2 text-problema-texto"
        >
          <Icono nombre="problema" tamano={16} />
          {aviso.texto}
        </p>,
      );
    if (aviso?.tipo === 'movido' && aviso.ancla === id) {
      const v = aviso.volver;
      cuerpo.push(
        <div key="aviso" className={esGrupo ? 'overflow-hidden rounded-[14px]' : ''}>
          {resultadoEn(
            aviso.texto,
            v === undefined
              ? undefined
              : () => {
                  if (enVuelo.current) return;
                  void enviar(
                    v.entrada,
                    arbol,
                    v.antes,
                    { tipo: 'movido', ancla: id, texto: v.texto },
                    `asa-${id}`,
                  );
                },
          )}
        </div>,
      );
    }
    if (aviso?.tipo === 'creado') {
      const { r } = aviso;
      const g =
        r.tipo === 'grupo'
          ? arbol.find((x) => x.id === r.id)
          : L.lugarDeCategoria(arbol, r.id)?.grupo;
      const nombre = g?.categorias.find((c) => c.id === r.id)?.nombre ?? '';
      if (g !== undefined && (r.tipo === 'grupo' ? `vacio-${r.id}` : r.id) === id)
        cuerpo.push(
          <div key="creado">
            {resultadoEn(
              r.tipo === 'grupo' ? t.grupoCreado(g.nombre) : t.categoriaCreada(nombre, g.nombre),
            )}
          </div>,
        );
    }
    return cuerpo.length === 0 ? null : cuerpo;
  };

  const cerrar = useCerrarFlujo('/presupuesto', false);
  const sinNormales = !todos.some((g) => g.categorias.some((c) => c.clase === 'normal'));
  const clases = new Map(
    todos.flatMap((g) => g.categorias.map((c) => [c.categoria.id, c.clase] as const)),
  );

  return (
    <PaginaFlujoDeRuta
      titulo={t.titulo}
      rutaPadre="/presupuesto"
      acciones={
        <Boton onClick={cerrar} className="min-h-12 flex-1">
          {t.listo}
        </Boton>
      }
      lateral={
        <>
          {arbol
            .filter((g) => g.sistema && !g.archivado)
            .map((g) => (
              <GrupoSistema key={g.id} grupo={g} />
            ))}
          <Archivadas grupos={todos} />
          <EnlaceFinn
            href={`${RAIZ}/grupos/nuevo`}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-accion-tonal font-semibold text-accion focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco"
          >
            <Icono nombre="plus" tamano={18} />
            {t.nuevoGrupo}
          </EnlaceFinn>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div role="status" data-anuncio="estructura" className="sr-only">
          {anuncio}
        </div>
        {sinNormales ? (
          <Vacio
            titulo={t.vacioTitulo}
            texto={t.vacioTexto}
            icono="grid"
            tono="neutro"
            accion={
              <EnlaceFinn href={`${RAIZ}/plantilla`} className={PRINCIPAL}>
                {t.usarPlantilla}
              </EnlaceFinn>
            }
          />
        ) : null}
        {usuarios.length === 0 ? null : (
          <div className="-my-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                guardarDe(todosCerrados ? [] : usuarios.map((g) => g.id));
                setAnuncio(todosCerrados ? t.expandisteTodos : t.colapsasteTodos);
              }}
              className="inline-flex min-h-11 items-center px-1.5 text-cuerpo-pequeno font-bold text-enlace focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco"
            >
              {todosCerrados ? t.expandirTodos : t.colapsarTodos}
            </button>
          </div>
        )}
        {usuarios.map((g) => (
          <GrupoEstructura
            key={g.id}
            grupo={g}
            colapsado={colapsados.has(g.id)}
            editable={(id) => clases.get(id) === 'normal'}
            abierta={(id) => barra?.id === id}
            enLugar={enLugar}
            alternar={() => {
              alternar(g);
            }}
            tocarAsa={tocarAsa}
          />
        ))}
      </div>
    </PaginaFlujoDeRuta>
  );
}

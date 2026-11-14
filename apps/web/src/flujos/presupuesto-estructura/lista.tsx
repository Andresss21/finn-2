'use client';
// `/presupuesto/estructura` (FT-18; 05 §2.3, §4.14): la lista de grupos y categorías con sus enlaces de alta y edición. [CH-272]
// C-46: los grupos se colapsan (recordado en el dispositivo) y el asa abre la barra «Mover», que manda un OP-08 por toque con
// `orden` (y `grupoId` al cruzar de grupo). La lista muestra el lugar nuevo mientras espera y, si OP-08 rechaza, vuelve al anterior
// con el error en línea. El orden nunca depende de arrastrar (WCAG 2.5.7). No calcula montos: los lugares salen del árbol de
// `estructura()` (`lugares.ts`). [CH-278] C-50: el resultado de mover, crear, deshacer y desarchivar es la etiqueta sobre la
// fila (`EtiquetaResultado`), una a la vez, que se va sola; mover deja ↶ en la fila hasta la siguiente acción y «Deshacer»
// devuelve lo movido a donde estaba antes del primer paso. La frase va a la única región de estado de la pantalla.
// [CH-275] El arrastre desde el asa (`arrastre.tsx`, con `import()` después de cargar): mientras dura, la lista dibuja el lugar
// donde caería (el hueco), el destino y la fila levantada; al soltar usa los mismos `moverCategoria` y `moverGrupo` que la barra.
import type { ResultadoAccion } from '@finn/aplicacion/errores';
import type { GrupoDeEstructura } from '@finn/dominio/selectores';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useColapsados } from '../../cliente/useColapsados';
import { Boton } from '../../componentes/base/boton';
import {
  DeshacerFila,
  EtiquetaResultado,
  useEtiqueta,
  type ResultadoEtiqueta,
} from '../../componentes/base/etiqueta-resultado';
import { Icono } from '../../componentes/base/icono';
import { Vacio } from '../../componentes/base/vacio';
import { PaginaFlujoDeRuta, useCerrarFlujo } from '../../componentes/navegacion/flujo-de-ruta';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { useOperacion } from '../../formularios/use-operacion';
import { editarEnEstructura } from '../../servidor/acciones/categorias';
import { estructura as t } from '../../textos/estructura';
import { estructuraEntrega4 as t4 } from '../../textos/estructura-entrega-4';
import { formularios } from '../../textos/formularios';
import { Archivadas, type Desarchivada } from './archivadas';
import type { Apunte, Tomar } from './arrastre';
import { BarraMover } from './barra-mover';
import { useFlip } from './flip';
import { GrupoEstructura, GrupoSistema } from './grupo';
import * as L from './lugares';
import type { ResultadoEstructura } from './resultado';

const RAIZ = '/presupuesto/estructura';
const CLAVE = 'finn.colapsados.estructura';
const PRINCIPAL =
  'inline-flex min-h-12 items-center rounded-control bg-accion px-5 font-semibold text-texto-sobre-accion focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

/** [CH-278] Dónde estaba lo movido antes del primer paso: «Deshacer» y ↶ lo devuelven ahí (CA-A-7). */
interface Volver {
  readonly id: string;
  readonly tipo: 'grupo' | 'categoria';
  readonly lugar: L.Lugar;
  readonly idx: number;
  readonly volvio: string;
}

interface Arrastre {
  readonly tipo: 'grupo' | 'categoria';
  readonly id: string;
  /** Dónde estaba lo tomado: ahí aparece la fila levantada. */
  readonly caja: DOMRect;
  readonly a: Apunte;
}

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
  const [error, setError] = useState<{ readonly ancla: string; readonly texto: string } | null>(
    null,
  );
  const [barra, setBarra] = useState<{ readonly id: string; readonly otro: boolean } | null>(null);
  const [anuncio, setAnuncio] = useState('');
  const etiqueta = useEtiqueta(setAnuncio);
  const { mostrar } = etiqueta;
  const volver = useRef<Volver | null>(null);
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
  // [CH-270] Lo creado (`?resultado=`): «Creada» en la fila nueva o «Creado» en el encabezado del grupo nuevo (C-50 §8). Si el
  // panel devolvió el foco a su disparador, queda ahí; si no, va a lo creado.
  const clave = resultado === undefined ? '' : `${resultado.tipo}:${resultado.id}`;
  const creado = useRef('');
  useEffect(() => {
    if (resultado === undefined || creado.current === clave) return;
    const esGrupo = resultado.tipo === 'grupo';
    const g = esGrupo
      ? arbol.find((x) => x.id === resultado.id)
      : L.lugarDeCategoria(arbol, resultado.id)?.grupo;
    if (g === undefined) return;
    creado.current = clave;
    if (!esGrupo && colapsados.has(g.id)) guardar([...colapsados].filter((x) => x !== g.id));
    const nombre = g.categorias.find((c) => c.id === resultado.id)?.nombre ?? '';
    mostrar(
      esGrupo
        ? { id: g.id, palabra: t.creado, frase: t.grupoCreado(g.nombre) }
        : { id: resultado.id, palabra: t.creada, frase: t.categoriaCreada(nombre, g.nombre) },
    );
    // Sin limpiar al volver a correr: mostrar la etiqueta vuelve a dibujar la lista antes de este momento.
    setTimeout(() => {
      const activo = document.activeElement;
      if (activo === null || activo === document.body)
        document
          .querySelector<HTMLElement>(`[data-foco="${esGrupo ? 'grupo' : 'fila'}-${resultado.id}"]`)
          ?.focus();
    }, 0);
  }, [arbol, clave, colapsados, guardar, mostrar, resultado]);
  // E4-6: lo desarchivado lleva «Desarchivada» con «Archivarla de nuevo» cuando ya está en su grupo (posición 5 de §3).
  const [desarchivada, setDesarchivada] = useState<Desarchivada | null>(null);
  useEffect(() => {
    if (desarchivada === null) return;
    const l = L.lugarDeCategoria(arbol, desarchivada.id);
    const visible =
      l !== undefined &&
      L.usuarios(arbol).some((g) => g.id === l.grupo.id) &&
      l.grupo.categorias.some((c) => c.id === desarchivada.id && !c.archivada);
    if (!visible) return;
    setDesarchivada(null);
    if (colapsados.has(l.grupo.id)) guardar([...colapsados].filter((x) => x !== l.grupo.id));
    mostrar({
      id: desarchivada.id,
      palabra: t.desarchivada,
      frase: desarchivada.conGrupo
        ? t4.desarchivasteConGrupo(desarchivada.nombre, desarchivada.grupo)
        : t4.desarchivaste(desarchivada.nombre, desarchivada.grupo),
      accion: {
        texto: t4.archivarDeNuevo,
        href: `/presupuesto/categorias/${desarchivada.id}/archivar`,
      },
    });
  }, [arbol, colapsados, desarchivada, guardar, mostrar]);

  const ultimo = useRef<ResultadoAccion<unknown> | null>(null);
  const llamar = useCallback(async (e: unknown) => {
    const r = await editarEnEstructura(e);
    ultimo.current = r;
    return r;
  }, []);
  const op = useOperacion({ accion: llamar });

  // [CH-275] El arrastre llega después de cargar la página, en el primer momento libre (como la Bandeja, 05 §13.3).
  const [modulo, setModulo] = useState<typeof import('./arrastre') | null>(null);
  useEffect(() => {
    let vivo = true;
    let libre = (): void => undefined;
    const cargar = () => {
      void import('./arrastre').then((m) => {
        if (vivo) setModulo(m);
      });
    };
    const programar = () => {
      if (typeof window.requestIdleCallback === 'function') {
        const i = window.requestIdleCallback(cargar, { timeout: 2000 });
        libre = () => {
          window.cancelIdleCallback(i);
        };
      } else {
        const i = window.setTimeout(cargar, 200);
        libre = () => {
          window.clearTimeout(i);
        };
      }
    };
    if (document.readyState === 'complete') programar();
    else window.addEventListener('load', programar, { once: true });
    return () => {
      vivo = false;
      window.removeEventListener('load', programar);
      libre();
    };
  }, []);
  const tomar = useRef<Tomar | null>(null);
  const registrar = useCallback((f: Tomar | null) => {
    tomar.current = f;
  }, []);
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const actual = useRef<Arrastre | null>(null);
  const fijar = (x: Arrastre | null) => {
    actual.current = x;
    setArrastre(x);
  };
  const raiz = useRef<HTMLDivElement>(null);
  const flip = useFlip(raiz);
  const enVuelo = useRef(false);
  /** Un OP-08: el lugar nuevo enseguida; con `ok`, el resultado; si no, el lugar de antes y el error debajo de la fila. */
  const enviar = async (
    entrada: L.EntradaMover,
    antes: L.Arbol,
    despues: L.Arbol,
    exito: () => void,
    foco: string,
  ) => {
    if (enVuelo.current) return;
    enVuelo.current = true;
    setArbol(despues);
    setError(null);
    // La acción siguiente reemplaza la etiqueta y se lleva el ↶.
    etiqueta.cerrar();
    etiqueta.otraAccion();
    enfocar.current = foco;
    ultimo.current = null;
    try {
      await op.enviar(entrada);
    } finally {
      enVuelo.current = false;
    }
    const r = ultimo.current as ResultadoAccion<unknown> | null;
    if (r?.ok === true) {
      exito();
      return;
    }
    setArbol(antes);
    const texto =
      r === null
        ? navigator.onLine
          ? formularios.incierto
          : formularios.sinConexion
        : r.error.mensaje;
    setError({ ancla: entrada.id, texto });
  };
  const nombreDe = (id: string) =>
    arbol.flatMap((g) => [g, ...g.categorias]).find((x) => x.id === id)?.nombre ?? '';
  /** «Deshacer» (en la etiqueta o en ↶): lo movido vuelve a donde estaba antes del primer paso, con «Volvió» y el foco en su fila. */
  const deshacer = (id: string) => {
    const v = volver.current;
    if (v?.id !== id) return;
    const m =
      v.tipo === 'grupo' ? L.moverGrupo(arbol, id, v.idx) : L.moverCategoria(arbol, id, v.lugar);
    const listo: ResultadoEtiqueta = { id, palabra: t.volvioPalabra, frase: v.volvio };
    const exito = () => {
      volver.current = null;
      mostrar(listo);
    };
    const foco = `${v.tipo === 'grupo' ? 'grupo' : 'fila'}-${id}`;
    if (m !== undefined) {
      void enviar(m.entrada, arbol, m.despues, exito, foco);
      return;
    }
    etiqueta.otraAccion();
    enfocar.current = foco;
    exito();
  };
  const deshacerAhora = useRef(deshacer);
  useEffect(() => {
    deshacerAhora.current = deshacer;
  });
  const aplicar = (
    m: L.Movimiento | undefined,
    tipo: Volver['tipo'],
    id: string,
    foco: string,
    soltado: boolean,
  ) => {
    if (m === undefined) return;
    // Varios pasos seguidos de la misma fila (la barra «Mover») se deshacen juntos.
    const previo = volver.current?.id === id && etiqueta.conInverso(id) ? volver.current : null;
    const l = L.lugarDeCategoria(arbol, id);
    const origen: Volver = previo ?? {
      id,
      tipo,
      lugar: { grupoId: l?.grupo.id ?? '', idx: l?.idx ?? 0 },
      idx: L.lugarDeGrupo(arbol, id).idx,
      volvio: m.volvio,
    };
    const nombre = nombreDe(id);
    void enviar(
      m.entrada,
      arbol,
      m.despues,
      () => {
        volver.current = origen;
        mostrar({
          id,
          palabra: tipo === 'grupo' ? t.movido : t.movida,
          frase: soltado ? t.soltaste(m.texto) : m.texto,
          accion: {
            texto: t.deshacer,
            icono: 'undo',
            alTocar: () => {
              deshacerAhora.current(id);
            },
          },
          inverso: tipo === 'grupo' ? t.deshacerGrupo(nombre) : t.deshacerCategoria(nombre),
        });
      },
      foco,
    );
  };
  /** Mover una categoría a un lugar (la barra y el arrastre). El grupo de destino se abre. */
  const moverCategoria = (
    cid: string,
    destino: L.Lugar | undefined,
    foco: string,
    soltado = false,
  ) => {
    if (destino === undefined) return;
    if (colapsados.has(destino.grupoId))
      guardarDe([...colapsados].filter((x) => x !== destino.grupoId));
    aplicar(L.moverCategoria(arbol, cid, destino), 'categoria', cid, foco, soltado);
  };
  const moverGrupo = (gid: string, idx: number | undefined, foco: string, soltado = false) => {
    if (idx !== undefined) aplicar(L.moverGrupo(arbol, gid, idx), 'grupo', gid, foco, soltado);
  };

  /** El árbol con lo tomado donde caería, y lo que dicen la fila levantada y el anuncio. */
  const previa = (x: Arrastre) =>
    (x.tipo === 'grupo' ? L.moverGrupo(arbol, x.id, x.a.idx) : L.moverCategoria(arbol, x.id, x.a))
      ?.despues ?? arbol;
  const describirArrastre = (x: Arrastre) => {
    const p = previa(x);
    if (x.tipo === 'grupo') {
      const { idx, n } = L.lugarDeGrupo(p, x.id);
      const ord = L.sinArticulo(L.ordinal(idx, n, false));
      const cats = p.find((g) => g.id === x.id)?.categorias.filter((c) => !c.archivada).length;
      return { hacia: t.haciaGrupo(ord, cats ?? 0), anuncio: t.grupoLugar(nombreDe(x.id), ord) };
    }
    const l = L.lugarDeCategoria(p, x.id);
    const ord = L.ordinal(l?.idx ?? 0, l?.n ?? 1, true);
    const grupo = l?.grupo.nombre ?? '';
    return {
      hacia: t.haciaCategoria(L.sinArticulo(ord), grupo),
      anuncio: t.sobre(grupo, ord, x.a.colapsado),
    };
  };
  /** Al soltar o cancelar, la fila parte de donde quedó la levantada (FLIP). */
  const terminar = (caja: DOMRect | undefined) => {
    const x = actual.current;
    fijar(null);
    if (x !== null && caja !== undefined) flip(`${x.tipo === 'grupo' ? 'g' : 'c'}-${x.id}`, caja);
    return x;
  };
  const arrastrar = {
    registrar,
    alTomar: (tipo: 'grupo' | 'categoria', id: string, caja: DOMRect) => {
      setBarra(null);
      const l = L.lugarDeCategoria(arbol, id);
      const a =
        tipo === 'grupo'
          ? { grupoId: '', idx: L.lugarDeGrupo(arbol, id).idx, colapsado: false }
          : { grupoId: l?.grupo.id ?? '', idx: l?.idx ?? 0, colapsado: false };
      fijar({ tipo, id, caja, a });
      etiqueta.pausar('arrastre');
      setAnuncio(tipo === 'grupo' ? t.tomasteGrupo(nombreDe(id)) : t.tomaste(nombreDe(id)));
    },
    alApuntar: (a: Apunte) => {
      const x = actual.current;
      if (x === null) return;
      fijar({ ...x, a });
      setAnuncio(describirArrastre({ ...x, a }).anuncio);
    },
    alAbrir: (gid: string) => {
      guardarDe([...colapsados].filter((x) => x !== gid));
      setAnuncio(t.seAbrio(nombreDe(gid)));
    },
    alSoltar: (caja: DOMRect | undefined) => {
      const x = terminar(caja);
      // Soltar en el mismo lugar vuelve a contar la etiqueta; en otro, la nueva la reemplaza (CA-A-5).
      etiqueta.reanudar('arrastre');
      if (x === null) return;
      const m =
        x.tipo === 'grupo'
          ? L.moverGrupo(arbol, x.id, x.a.idx)
          : L.moverCategoria(arbol, x.id, x.a);
      if (m === undefined) {
        setAnuncio(t.mismoLugar(nombreDe(x.id)));
        return;
      }
      if (x.tipo === 'grupo') moverGrupo(x.id, x.a.idx, `asa-${x.id}`, true);
      else moverCategoria(x.id, x.a, `asa-${x.id}`, true);
    },
    alCancelar: (caja: DOMRect | undefined) => {
      const x = terminar(caja);
      etiqueta.reanudar('arrastre');
      if (x !== null) setAnuncio(t.cancelado(nombreDe(x.id)));
    },
  };
  // Mientras se arrastra: el árbol con el hueco donde caería (sobre un grupo colapsado, solo sin la categoría); al tomar un
  // grupo, todos colapsados sin tocar lo guardado.
  const vista: L.Arbol =
    arrastre === null
      ? arbol
      : arrastre.tipo === 'categoria' && arrastre.a.colapsado
        ? arbol.map((g) => ({
            ...g,
            categorias: g.categorias.filter((c) => c.id !== arrastre.id),
          }))
        : previa(arrastre);
  const cerradosVista =
    arrastre?.tipo === 'grupo' ? new Set(usuarios.map((g) => g.id)) : colapsados;
  const cat = arrastre?.tipo === 'categoria' ? arrastre : null;
  const origen = cat === null ? undefined : L.lugarDeCategoria(arbol, cat.id)?.grupo.id;

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

  /** [CH-278] Dentro de la fila o del encabezado, después de su contenido: el ↶ y la etiqueta. */
  const enFila = (id: string): ReactNode => (
    <>
      <DeshacerFila api={etiqueta} id={id} />
      <EtiquetaResultado api={etiqueta} id={id} />
    </>
  );
  /** Lo que va debajo de una fila o de un encabezado: su barra «Mover» y el error. */
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
    if (error?.ancla === id)
      cuerpo.push(
        <p
          key="error"
          role="alert"
          className="text-cuerpo-pequeno flex items-center gap-2 px-4 py-2 text-problema-texto"
        >
          <Icono nombre="problema" tamano={16} />
          {error.texto}
        </p>,
      );
    return cuerpo.length === 0 ? null : cuerpo;
  };

  const cerrar = useCerrarFlujo('/presupuesto', false);
  const sinNormales = !todos.some((g) => g.categorias.some((c) => c.clase === 'normal'));
  const clases = new Map<string, string>(
    todos.flatMap((g) => g.categorias.map((c) => [c.categoria.id, c.clase] as const)),
  );

  return (
    <PaginaFlujoDeRuta
      titulo={t.titulo}
      rutaPadre="/presupuesto"
      acciones={
        <Boton onClick={cerrar} className="min-h-12 flex-1" inert={arrastre !== null}>
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
          <Archivadas
            grupos={todos}
            alDesarchivar={(d) => {
              etiqueta.cerrar();
              etiqueta.otraAccion();
              setDesarchivada(d);
            }}
          />
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
      <div ref={raiz} className="flex flex-col gap-5">
        {modulo === null ? null : <modulo.ContextoArrastre {...arrastrar} />}
        {arrastre === null
          ? null
          : createPortal(
              <div
                data-fila-levantada
                className="fz-levantada pointer-events-none fixed z-50 flex min-h-14 items-center gap-1.5 rounded-xl bg-superficie-elevada py-1 pr-4 pl-1"
                style={{
                  left: arrastre.caja.left,
                  top: arrastre.caja.top,
                  width: arrastre.caja.width,
                }}
              >
                <span className="inline-flex size-11 shrink-0 items-center justify-center text-accion">
                  <Icono nombre="grip" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-cuerpo truncate font-semibold">
                    {nombreDe(arrastre.id)}
                  </span>
                  <span className="text-etiqueta flex items-center gap-1 font-bold text-accion">
                    <Icono nombre="in" tamano={18} />
                    {describirArrastre(arrastre).hacia}
                  </span>
                </span>
              </div>,
              document.body,
            )}
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
        {L.usuarios(vista).map((g) => (
          <GrupoEstructura
            key={g.id}
            grupo={g}
            colapsado={cerradosVista.has(g.id)}
            presionar={
              modulo === null
                ? undefined
                : (e, tipo, id) => {
                    tomar.current?.(e, tipo, id);
                  }
            }
            hueco={cat?.id}
            huecoGrupo={arrastre?.tipo === 'grupo' && arrastre.id === g.id}
            destino={cat !== null && cat.a.grupoId === g.id && g.id !== origen}
            sobreColapsado={
              cat !== null && cat.a.colapsado && cat.a.grupoId === g.id && colapsados.has(g.id)
            }
            editable={(id) => clases.get(id) === 'normal'}
            abierta={(id) => barra?.id === id}
            enLugar={enLugar}
            enFila={enFila}
            resaltada={etiqueta.resaltada}
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

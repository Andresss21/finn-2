'use client';
import { useEffect, useRef, useState, type ComponentType } from 'react';
import { aprobarConCategoria } from './acciones';
import type { movimientos as M, destinos as D } from './datos';
type Props = { movimientos: typeof M; destinos: typeof D; conArrastre: boolean };
export type PropsArrastre = Props & { alSoltar: (movimientoId: string, categoriaId: string) => void; resultados: Record<string, string> };
export function Lista(props: Props) {
  const [Arrastre, setArrastre] = useState<ComponentType<PropsArrastre> | null>(null);
  const [resultados, setResultados] = useState<Record<string, string>>({});
  const pedido = useRef(false);
  const cargar = () => {
    if (pedido.current || !props.conArrastre) return;
    pedido.current = true;
    (window as any).__arrastrePedido = performance.now();
    import('./arrastre').then((m) => { (window as any).__arrastreListo = performance.now(); setArrastre(() => m.ListaArrastrable); });
  };
  useEffect(() => {
    (window as any).__hidratado = performance.now();
    const ric = (window as any).requestIdleCallback ?? ((f: () => void) => setTimeout(f, 200));
    ric(cargar, { timeout: 2000 });
  }, []);
  const alSoltar = async (movimientoId: string, categoriaId: string) => {
    const r = await aprobarConCategoria({ movimientoId, categoriaId });
    setResultados((x) => ({ ...x, [movimientoId]: `Aprobado: ${movimientoId} · ${r.aprobado.categoriaId}` }));
  };
  if (Arrastre) return <Arrastre {...props} alSoltar={alSoltar} resultados={resultados} />;
  return (
    <ul onPointerDown={cargar}>
      {props.movimientos.map((m) => (
        <li key={m.id} data-testid={`fila-${m.id}`}>
          {resultados[m.id] ?? <>{m.comercio} {m.monto} <button onClick={() => m.sugerida && alSoltar(m.id, m.sugerida.id)}>Aprobar</button> <a href={`/bandeja/${m.id}`}>Revisar</a></>}
        </li>
      ))}
    </ul>
  );
}

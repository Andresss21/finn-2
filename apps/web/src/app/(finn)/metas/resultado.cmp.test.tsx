// CH-248 (E4-18, E6-14): editar una meta deja su resultado en la lista de Metas, en el lugar del aviso de la vencida. Se prueba el
// contrato de la URL que lo lleva y lo que dibuja la pantalla; el recorrido completo (editar, volver, la fila sin «Vencida») es de la E2E.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { MetasDto } from '@finn/aplicacion/consultas/metas';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../globals.css';
import { leerResultadoMeta, rutaMetasConResultado } from '../../../flujos/metas-meta/resultado';
import { PantallaMetas } from './pantalla';

vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(() => {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
});

const ID = '3f2b8a1e-0c4d-4e6a-9b7f-1a2b3c4d5e6f';
const ACTIVO = {
  inicio: '2027-02-21',
  fin: '2027-03-20',
  dias: 28,
  estado: 'activo',
  transicion: false,
  diasTranscurridos: 10,
  diasRestantes: 18,
};
const meta = {
  id: ID,
  categoria: { id: 'c1', nombre: 'Viaje' },
  grupo: { id: 'g', nombre: 'Casa' },
  tipo: 'para_fecha',
  monto: 200000,
  fechaCreacion: '2027-02-10',
  fechaObjetivoVigente: '2027-12-31',
  pedido: 12000,
  falta: 12000,
  disponible: 8000,
  estado: 'con_faltante',
  vencida: false,
  esperado: {},
};
const dto = {
  revision: 'r1',
  hoy: '2027-02-21',
  periodoActivo: ACTIVO,
  notificacionesNoLeidas: 0,
  bandejaPorRevisar: 0,
  metas: [meta],
  categoriasSinMeta: [],
} as unknown as MetasDto;

function montar(arbol: ReactNode): HTMLElement {
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(arbol);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

describe('PRU-CMP-META-780 el resultado de editar una meta viaja en la URL de la lista', () => {
  it('PRU-CMP-META-780 la ruta lleva el resultado y se lee de vuelta; un valor mal formado no se muestra', () => {
    expect(rutaMetasConResultado({ tipo: 'extendida', metaId: ID, fecha: '2027-12-31' })).toBe(
      `/metas?resultado=extendida%3A${ID}%3A2027-12-31`,
    );
    expect(rutaMetasConResultado({ tipo: 'ajustada', metaId: ID })).toBe(
      `/metas?resultado=ajustada%3A${ID}`,
    );
    expect(leerResultadoMeta(`extendida:${ID}:2027-12-31`)).toEqual({
      tipo: 'extendida',
      metaId: ID,
      fecha: '2027-12-31',
    });
    expect(leerResultadoMeta(`ajustada:${ID}`)).toEqual({ tipo: 'ajustada', metaId: ID });
    for (const malo of [
      undefined,
      '',
      'ajustada',
      'ajustada:m1',
      `ajustada:${ID}:2027-12-31`,
      `extendida:${ID}`,
      `extendida:${ID}:ayer`,
      `extendida:${ID}:2027-12-31:x`,
      `otro:${ID}`,
    ]) {
      expect(leerResultadoMeta(malo)).toBeUndefined();
    }
  });
});

describe('PRU-CMP-META-781 el resultado en la lista de Metas', () => {
  it('PRU-CMP-META-781 [CA-E6-17] extender la fecha dice «Extendiste la meta de {categoría} al {fecha}.» y no ofrece salida para revertir', () => {
    const nodo = montar(
      <PantallaMetas
        dto={dto}
        resultado={{ tipo: 'extendida', metaId: ID, fecha: '2027-12-31' }}
      />,
    );
    const r = nodo.querySelector('[data-testid="resultado"]');
    expect(r?.textContent).toBe('Extendiste la meta de Viaje al 31/12/2027.');
    expect(r?.querySelector('button')).toBeNull();
    expect(nodo.querySelector('[data-vencida="si"]')).toBeNull();
  });

  it('PRU-CMP-META-781 ajustar el monto dice «Ajustaste la meta de {categoría}.»; sin resultado, o con una meta que no está, no se dibuja nada', () => {
    const ajustada = montar(
      <PantallaMetas dto={dto} resultado={{ tipo: 'ajustada', metaId: ID }} />,
    );
    expect(ajustada.querySelector('[data-testid="resultado"]')?.textContent).toBe(
      'Ajustaste la meta de Viaje.',
    );
    const sin = montar(<PantallaMetas dto={dto} />);
    expect(sin.querySelector('[data-testid="resultado"]')).toBeNull();
    const otra = montar(
      <PantallaMetas
        dto={dto}
        resultado={{ tipo: 'ajustada', metaId: '00000000-0000-4000-8000-000000000000' }}
      />,
    );
    expect(otra.querySelector('[data-testid="resultado"]')).toBeNull();
  });
});

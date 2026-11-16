// C-33 (pedido del dueño): ningún enlace ni botón de texto lleva subrayado, tampoco al pasar el puntero; se distinguen por
// `--enlace` y el peso 700. Lee los archivos de producción de `apps/web/src`, como PRU-CMP-PWA-702: la clase `underline` (con o
// sin variante, `hover:underline`) no aparece en ninguno. `no-underline` sí, porque lo quita.
import { describe, expect, it } from 'vitest';

const PRODUCCION: Record<string, string> = import.meta.glob<string>(
  ['../../**/*.{ts,tsx}', '!../../**/*.test.{ts,tsx}'],
  { query: '?raw', import: 'default', eager: true },
);

/** Las líneas con la clase `underline` (no `no-underline`), fuera de los comentarios. */
function subrayados(): string[] {
  const clase = /(^|[\s'"`:])underline(?=[\s'"`]|$)/;
  return Object.entries(PRODUCCION).flatMap(([ruta, texto]) =>
    texto
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .map((linea, i) => ({ linea: linea.replace(/(^|\s)\/\/.*$/, '$1'), i }))
      .filter(({ linea }) => clase.test(linea))
      .map(({ i }) => `${ruta.replace('../../', '')}:${String(i + 1)}`),
  );
}

describe('PRU-CMP-PWA sin subrayado en las acciones', () => {
  it('PRU-CMP-PWA-821 [C-33] ningún enlace ni botón de apps/web/src lleva la clase underline, ni al pasar el puntero: tampoco «Editar» y «Ver la categoría» de Metas ni los enlaces de Presupuesto y del detalle de categoría', () => {
    expect(Object.keys(PRODUCCION).length).toBeGreaterThan(100);
    expect(subrayados()).toEqual([]);
  });

  it('PRU-CMP-PWA-822 [C-33] las acciones de texto de Metas, Presupuesto y el detalle de categoría usan el estilo de enlace de la app: --enlace y peso 700', () => {
    const archivos = [
      'app/(finn)/metas/pantalla.tsx',
      'flujos/metas-nueva/lector.tsx',
      'app/(finn)/presupuesto/pantalla.tsx',
      'app/(finn)/presupuesto/categorias/[categoriaId]/pantalla.tsx',
      'app/(finn)/presupuesto/categorias/[categoriaId]/pago.tsx',
      'app/(finn)/presupuesto/categorias/[categoriaId]/consumos.tsx',
    ];
    for (const archivo of archivos) {
      const texto = PRODUCCION[`../../${archivo}`] ?? '';
      expect(texto, archivo).toMatch(/font-bold text-enlace/);
    }
  });
});

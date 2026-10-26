import type { Escenario } from './tipos';

// `import.meta.glob` lo resuelve Vite al transformar el archivo; @finn/dominio no depende de Vite, así que se declara aquí.
declare global {
  interface ImportMeta {
    glob<T>(
      patron: string,
      opciones: { eager: true; query?: string; import?: string },
    ): Record<string, T>;
  }
}

// Todos los escenarios de datos/: agregar uno es agregar su archivo (sin tocar este).
const modulos = import.meta.glob<{ default: Escenario }>('./datos/esc-*.ts', { eager: true });
export const ESCENARIOS = new Map(Object.values(modulos).map((m) => [m.default.id, m.default]));
/** El texto de cada archivo de datos, por su ruta: lo lee la prueba de la regla 11 (07 §12.3). */
export const FUENTES = import.meta.glob<string>('./datos/esc-*.ts', {
  eager: true,
  query: '?raw',
  import: 'default',
});

'use client';
// Tema por `data-theme="claro" | "oscuro"` (05 §10.6, CF-10). Se guarda por dispositivo; no escribe en el servidor.
import { ThemeProvider as ProveedorNextThemes, type ThemeProviderProps } from 'next-themes';
import { useEffect, type ReactNode } from 'react';

// next-themes 0.4.6 declara `children` con `PropsWithChildren` sin argumento, que @types/react 19.3 no resuelve.
const ThemeProvider = ProveedorNextThemes as (
  props: ThemeProviderProps & { readonly children: ReactNode },
) => ReactNode;

export function ProveedorTema({ children }: { readonly children: ReactNode }) {
  // Contrato de 05 §14.3: `data-hidratado` en el primer efecto del marco, para que la E2E espere la hidratación.
  useEffect(() => {
    document.documentElement.dataset['hidratado'] = 'si';
  }, []);
  return (
    // [CH-74] El script previo a hidratar de next-themes escribe el nombre del tema sin pasar por `value` (solo lo mapea con
    // `class`): los temas se llaman `claro` y `oscuro` para que `data-theme` sea correcto desde el primer dibujo (CA-77.2).
    <ThemeProvider
      attribute="data-theme"
      themes={['claro', 'oscuro']}
      value={{ claro: 'claro', oscuro: 'oscuro', light: 'claro', dark: 'oscuro' }}
      enableColorScheme={false}
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="finn-tema"
    >
      {children}
    </ThemeProvider>
  );
}

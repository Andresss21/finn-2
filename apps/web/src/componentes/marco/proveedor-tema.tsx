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
    <ThemeProvider
      attribute="data-theme"
      value={{ light: 'claro', dark: 'oscuro' }}
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="finn-tema"
    >
      {children}
    </ThemeProvider>
  );
}

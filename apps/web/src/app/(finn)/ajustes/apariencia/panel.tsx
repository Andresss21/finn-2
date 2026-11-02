'use client';
// Panel del tema (FT-77; 05 §10.6): Sistema, Claro y Oscuro. next-themes lo guarda en `localStorage` del dispositivo
// (`finn-tema`) y pone `data-theme` en `<html>`; no escribe en el servidor. No importa nada de Next, para probarse aparte.
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Seleccion, type Opcion } from '../../../../componentes/base/seleccion';
import { ajustesApariencia as t } from '../../../../textos/ajustes-apariencia';

const OPCIONES: readonly Opcion[] = [
  { valor: 'system', etiqueta: t.sistema, descripcion: t.sistemaDescripcion },
  { valor: 'claro', etiqueta: t.claro },
  { valor: 'oscuro', etiqueta: t.oscuro },
];

/** Valores que guardaba la versión anterior (`light`, `dark`) [CH-74]: se muestran como el tema equivalente. */
const ANTIGUOS: Readonly<Record<string, string>> = { light: 'claro', dark: 'oscuro' };

export function PanelApariencia() {
  // Los tipos de next-themes 0.4.6 no resuelven con @types/react 19.3 (como en `proveedor-tema.tsx`): se fija la forma que se usa.
  const { theme, setTheme } = useTheme() as unknown as {
    readonly theme?: string;
    readonly setTheme: (tema: string) => void;
  };
  // Antes de hidratar, next-themes aún no leyó el almacenamiento: se muestra «Sistema» para no desajustar el HTML.
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    setMontado(true);
  }, []);
  return (
    <Seleccion
      etiqueta={t.etiqueta}
      descripcion={t.descripcion}
      opciones={OPCIONES}
      valor={montado && theme !== undefined ? (ANTIGUOS[theme] ?? theme) : 'system'}
      alCambiar={setTheme}
    />
  );
}

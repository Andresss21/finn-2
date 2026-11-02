// `sessionStorage` de la pestaña (05 §4.11): cada lectura y escritura va en `try/catch`. Si el almacenamiento no está
// disponible (ventana privada, datos bloqueados, vista previa), el formulario funciona igual, sin borrador y sin avisar.
// Solo el borrador de un flujo largo vive aquí; nada sale del dispositivo ni se comparte con otras pestañas (D-5).

export const almacen = {
  leer(clave: string): string | null {
    try {
      return window.sessionStorage.getItem(clave);
    } catch {
      return null;
    }
  },
  escribir(clave: string, valor: string): void {
    try {
      window.sessionStorage.setItem(clave, valor);
    } catch {
      return;
    }
  },
  borrar(clave: string): void {
    try {
      window.sessionStorage.removeItem(clave);
    } catch {
      return;
    }
  },
  /** Preferencias del dispositivo (06 §3.15, como el tema): `localStorage`, igual de tolerante. Nunca guardan montos. */
  leerLocal(clave: string): string | null {
    try {
      return window.localStorage.getItem(clave);
    } catch {
      return null;
    }
  },
  escribirLocal(clave: string, valor: string): void {
    try {
      window.localStorage.setItem(clave, valor);
    } catch {
      return;
    }
  },
  borrarLocal(clave: string): void {
    try {
      window.localStorage.removeItem(clave);
    } catch {
      return;
    }
  },
  /** Al salir de la sesión (05 §4.11): todas las claves que empiezan con el prefijo. */
  borrarPrefijo(prefijo: string): void {
    try {
      const claves: string[] = [];
      for (let i = 0; i < window.sessionStorage.length; i += 1) {
        const clave = window.sessionStorage.key(i);
        if (clave !== null && clave.startsWith(prefijo)) claves.push(clave);
      }
      for (const clave of claves) window.sessionStorage.removeItem(clave);
    } catch {
      return;
    }
  },
  /** ¿Hay alguna clave con ese prefijo? Sin leer valores (05 §8.5: `/sin-conexion` no lee montos). */
  hayPrefijo(prefijo: string): boolean {
    try {
      for (let i = 0; i < window.sessionStorage.length; i += 1)
        if (window.sessionStorage.key(i)?.startsWith(prefijo) === true) return true;
    } catch {
      return false;
    }
    return false;
  },
} as const;

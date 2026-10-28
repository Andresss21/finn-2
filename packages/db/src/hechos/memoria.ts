// Memoria por instancia (04 §5.3, BE-22): vive en el proceso y nunca se escribe en la base. Guarda los hechos de
// una revisión (capacidad 1) y las instantáneas por `(revisión, hoy)` (capacidad 2, el cruce de medianoche).
// - Una sola carga a la vez por revisión: la segunda petición espera la promesa de la primera.
// - Tras escribir, `registrarEscritura` reemplaza los hechos con los valores que devolvió la base (BE-32) y los
//   vacía ante cualquier duda: una fila con `revision` o `secuencia` pendiente, o un valor que no encaja.
// - Una lectura cuya revisión es menor que la memorizada indica una restauración o un error: vacía.
// `@finn/db` no calcula: la instantánea la arma la función que recibe quien llama (04 §1.3).
import type { Hechos, TablaMotor } from '@finn/dominio';
import type { ValorDeLaBase, ValoresDeLaBase } from './traductor.ts';

const CAPACIDAD_INSTANTANEAS = 2;
const SUBTIPOS: ReadonlySet<string> = new Set(['tarjetas', 'prestamos', 'inversiones']);
type Fila = Record<string, unknown>;

const mayor = (a: string, b: string): boolean => BigInt(a) > BigInt(b);
const claveDe = (tabla: string): string => (SUBTIPOS.has(tabla) ? 'cuentaId' : 'id');

export class Memoria<I = unknown> {
  #entrada: { readonly revision: string; readonly hechos: Hechos } | null = null;
  readonly #cargas = new Map<string, Promise<Hechos>>();
  #instantaneas: { readonly clave: string; readonly valor: I }[] = [];

  /** La revisión memorizada, o `null` si la memoria está vacía. */
  get revision(): string | null {
    return this.#entrada?.revision ?? null;
  }

  /** Vacía hechos e instantáneas: la siguiente lectura recarga desde la base. */
  vaciar(): void {
    this.#entrada = null;
    this.#instantaneas = [];
  }

  /** Los hechos de `revision`: de la memoria si coincide; si no, `cargar()` (una sola carga a la vez). */
  async hechos(revision: string, cargar: () => Promise<Hechos>): Promise<Hechos> {
    if (this.#entrada?.revision === revision) return this.#entrada.hechos;
    if (this.#entrada && mayor(this.#entrada.revision, revision)) this.vaciar();
    const enCurso = this.#cargas.get(revision);
    if (enCurso) return enCurso;
    const carga = cargar().then(
      (hechos) => {
        this.#cargas.delete(revision);
        this.#entrada = { revision, hechos };
        return hechos;
      },
      (e: unknown) => {
        this.#cargas.delete(revision);
        throw e;
      },
    );
    this.#cargas.set(revision, carga);
    return carga;
  }

  /** La instantánea de `(revision, hoy)`: de la memoria o `calcular()`; se conservan las dos últimas. */
  instantanea(revision: string, hoy: string, calcular: () => I): I {
    const clave = `${revision}|${hoy}`;
    const hallada = this.#instantaneas.find((x) => x.clave === clave);
    if (hallada) return hallada.valor;
    const valor = calcular();
    this.#instantaneas = [...this.#instantaneas, { clave, valor }].slice(-CAPACIDAD_INSTANTANEAS);
    return valor;
  }

  /**
   * Después del COMMIT (04 §4.2, paso 13): reemplaza los hechos por `(revisionNueva, hechosNuevos)` completados
   * con lo que fijó la base. Devuelve `false` y vacía la memoria si algo queda pendiente o no encaja.
   */
  registrarEscritura(
    revisionNueva: string,
    hechosNuevos: Hechos,
    valores: ValoresDeLaBase,
  ): boolean {
    try {
      const completos = completar(hechosNuevos, valores);
      if (completos === null) {
        this.vaciar();
        return false;
      }
      this.#entrada = { revision: revisionNueva, hechos: completos };
      this.#instantaneas = [];
      return true;
    } catch {
      this.vaciar();
      return false;
    }
  }
}

/** `hechosNuevos` con `revision` y `secuencia` de la base; `null` si queda alguna fila pendiente o sin dueño. */
function completar(hechos: Hechos, valores: ValoresDeLaBase): Hechos | null {
  const porTabla = new Map<TablaMotor, Map<string, (typeof valores)[number]>>();
  for (const v of valores) {
    const m = porTabla.get(v.tabla) ?? new Map<string, ValorDeLaBase>();
    m.set(v.id, v);
    porTabla.set(v.tabla, m);
  }
  const resultado: Record<string, readonly Fila[]> = {};
  for (const tabla of Object.keys(hechos) as TablaMotor[]) {
    const filas = hechos[tabla] as unknown as readonly Fila[];
    const deLaBase = porTabla.get(tabla);
    const clave = claveDe(tabla);
    const vistos = new Set<string>();
    const nuevas = filas.map((f) => {
      const v = deLaBase?.get(String(f[clave]));
      if (v === undefined) return f;
      vistos.add(v.id);
      return {
        ...f,
        revision: v.revision,
        ...(v.secuencia === undefined ? {} : { secuencia: v.secuencia }),
      };
    });
    // un valor de la base para una fila que el dominio no tiene: duda
    if (deLaBase && vistos.size !== deLaBase.size) return null;
    // una fila con revisión o secuencia pendiente (BE-32)
    for (const f of nuevas)
      if (
        ('revision' in f && f['revision'] == null) ||
        ('secuencia' in f && f['secuencia'] == null)
      )
        return null;
    resultado[tabla] = nuevas;
  }
  return resultado as unknown as Hechos;
}

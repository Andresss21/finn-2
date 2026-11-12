// Los datos de los rechazos de la política de patrones (04 §7.10 [CH-240] [CH-247], §8.5) para sus textos de `mensajes.ts`. No decide
// nada de la política: solo describe en español lo que `validarFormato` ya rechazó. Nunca muestra el mensaje de V8 en inglés.
import { gruposDe, type ValidacionFormato } from '@finn/sms';

type Rechazado = Extract<ValidacionFormato, { valido: false }>;
type Datos = Readonly<Record<string, string | number>>;

const LARGO_CADENA = 40;
const OBLIGATORIOS = ['ultimos4', 'monto'] as const;

/** CH-247 d: los mensajes de V8 más comunes; otro mensaje da el texto sin detalle. */
const DETALLES: Readonly<Record<string, string>> = {
  'Unterminated group': 'falta cerrar un paréntesis',
  "Unmatched ')'": 'sobra un paréntesis de cierre',
  'Unterminated character class': 'falta cerrar un corchete',
  'numbers out of order in {} quantifier': 'los números de unas llaves están al revés',
  'Range out of order in character class': 'un rango entre corchetes está al revés',
  'Duplicate capture group name': 'hay dos grupos con el mismo nombre',
  'Invalid capture group name': 'un nombre de grupo no es válido',
  '\\ at end of pattern': 'termina con una barra invertida',
  'Nothing to repeat': 'hay un cuantificador que no repite nada',
  'Invalid group': 'hay un grupo mal escrito',
};

function detalle(patron: string, banderas: string): string | undefined {
  try {
    new RegExp(patron, banderas);
    return undefined;
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : '';
    return DETALLES[mensaje.slice(mensaje.lastIndexOf(': ') + 2)];
  }
}

const miles = (n: number): string => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
// Los caracteres de control del ataque (\t, \n, \0) se ven como espacios y se recortan los bordes
const visible = (s: string): string =>
  s
    .replace(/[\u0000-\u001f]/g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim();

/** CH-247 b: «"en" seguido de 2,000 espacios», a partir de la parte del patrón que se repite; hasta 40 caracteres. */
export function describirRepeticion(r: {
  prefijo: string;
  repetido: string;
  veces: number;
}): string {
  const repetido = visible(r.repetido);
  const unidad = repetido === '' ? 'espacios' : `veces «${repetido}»`;
  const cola = `${miles(r.veces)} ${unidad}`;
  const prefijo = visible(r.prefijo);
  const cadena = prefijo === '' ? cola : `«${prefijo}» seguido de ${cola}`;
  return cadena.length <= LARGO_CADENA ? cadena : `${cadena.slice(0, LARGO_CADENA - 1)}…`;
}

const enLista = (xs: readonly string[]): string =>
  xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs.at(-1) ?? ''}`;

/** Los datos del texto de cada rechazo de 04 §8.5. */
export function datosDeRechazoDeFormato(
  v: Rechazado,
  f: {
    readonly patron: string;
    readonly banderas: string;
    readonly formatosFecha: readonly string[];
  },
): Datos {
  switch (v.error) {
    case 'patron_invalido': {
      const d = detalle(f.patron, f.banderas);
      return d === undefined ? {} : { detalle: d };
    }
    case 'banderas_no_permitidas':
      return {};
    case 'grupos_obligatorios': {
      const hay = gruposDe(f.patron, f.banderas);
      const faltan = [
        ...OBLIGATORIOS.filter((g) => !hay.has(g)),
        ...(f.formatosFecha.length > 0 && !hay.has('fecha') ? ['fecha'] : []),
      ];
      return faltan.length === 0 ? {} : { grupos: enLista(faltan) }; // sin faltantes: sobra `fecha`
    }
    case 'patron_lento':
      return v.grado === null
        ? {}
        : {
            grado: v.grado,
            ...(v.repeticion === undefined ? {} : { cadena: describirRepeticion(v.repeticion) }),
          };
  }
}

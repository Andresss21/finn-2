// V5-01 (entrada de montos) y V5-02 (formato es-SV). Se ejecuta con Node 24:
//   node v5-01-02.test.ts
import { normalizarMontoEscrito as n, textoParaEnviar, limpiarPegado, filtrarTecleo } from './entrada-monto.ts';
import { desdeTexto, desdeEntero, type Centavos } from './centavos.ts';
import {
  formatearMonto, formatearMontoTexto, formatearFecha, formatearFechaTexto,
  formatearInstante, formatearPorcentaje, centavosATextoDecimal,
} from './formato.ts';

let fallos = 0, casos = 0;
const igual = (nombre: string, obtenido: unknown, esperado: unknown) => {
  casos++;
  const a = JSON.stringify(obtenido), b = JSON.stringify(esperado);
  if (a !== b) { fallos++; console.log(`FALLA ${nombre}: obtenido ${a}, esperado ${b}`); }
};
const MONTO_TEXTO = /^\d{1,8}(\.\d{1,2})?$/;          // 04 §13.3 (primitivo montoTexto)

// --- V5-01a: tabla de casos ---------------------------------------------------
const tabla: [string, unknown][] = [
  ['', { estado: 'vacio' }],
  ['.', { estado: 'incompleto' }],
  [',', { estado: 'incompleto' }],
  ['5', { estado: 'valido', normalizado: '5', esCero: false }],
  ['5.', { estado: 'valido', normalizado: '5', esCero: false }],
  ['5,', { estado: 'valido', normalizado: '5', esCero: false }],
  ['.5', { estado: 'valido', normalizado: '0.5', esCero: false }],
  [',75', { estado: 'valido', normalizado: '0.75', esCero: false }],
  ['12,3', { estado: 'valido', normalizado: '12.3', esCero: false }],
  ['12.30', { estado: 'valido', normalizado: '12.30', esCero: false }],
  ['0045,10', { estado: 'valido', normalizado: '45.10', esCero: false }],
  ['0', { estado: 'valido', normalizado: '0', esCero: true }],
  ['0,00', { estado: 'valido', normalizado: '0.00', esCero: true }],
  ['1,234', { estado: 'invalido', motivo: 'max_dos_decimales' }],
  ['1.234', { estado: 'invalido', motivo: 'max_dos_decimales' }],
  ['1.2.3', { estado: 'invalido', motivo: 'mas_de_un_separador' }],
  ['1,234.50', { estado: 'invalido', motivo: 'mas_de_un_separador' }],
  ['123456789', { estado: 'invalido', motivo: 'demasiado_grande' }],
  ['21474836.47', { estado: 'valido', normalizado: '21474836.47', esCero: false }],
  ['21474836.48', { estado: 'invalido', motivo: 'demasiado_grande' }],
  ['99999999', { estado: 'invalido', motivo: 'demasiado_grande' }],
  ['$12a.5', { estado: 'valido', normalizado: '12.5', esCero: false }], // tecleo filtrado
];
for (const [t, e] of tabla) igual(`normalizar(${JSON.stringify(t)})`, n(t), e);

igual('enviar negativo', textoParaEnviar(n('45'), 'negativo'), '-45');
igual('enviar cero sin signo', textoParaEnviar(n('0'), 'negativo'), '0');
igual('enviar inválido', textoParaEnviar(n('1,234'), 'positivo'), null);
igual('filtrarTecleo', filtrarTecleo('1 2-3$4'), '1234');

const pegados: [string, { texto: string; negativo: boolean }][] = [
  ['$1,234.50', { texto: '1234.50', negativo: false }],
  ['1.234,50', { texto: '1234.50', negativo: false }],
  ['USD 45.00', { texto: '45.00', negativo: false }],
  ['-$45.00', { texto: '45.00', negativo: true }],
  ['($12.30)', { texto: '12.30', negativo: true }],
  ['1,234,567', { texto: '1234567', negativo: false }],
  ['1,234', { texto: '1,234', negativo: false }],          // ambiguo: lo marca normalizar
  [' 12,5 ', { texto: '12,5', negativo: false }],
];
for (const [t, e] of pegados) igual(`limpiarPegado(${JSON.stringify(t)})`, limpiarPegado(t), e);

// --- V5-01b: propiedad. Todo monto válido escrito de cualquier forma aceptada
// produce un texto que cumple montoTexto y vuelve exactamente a los mismos centavos.
let semilla = 20261014;
const azar = () => (semilla = (semilla * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
const MAX = 2_147_483_647;
let prop = 0;
for (let i = 0; i < 300_000; i++) {
  const c = i < 100_000 ? i : Math.floor(azar() * (MAX + 1));
  const entero = Math.floor(c / 100), cent = c % 100;
  const sep = azar() < 0.5 ? '.' : ',';
  const ceros = '0'.repeat(Math.floor(azar() * 3));
  const variantes = [
    `${ceros}${entero}${sep}${String(cent).padStart(2, '0')}`,
    cent === 0 ? `${entero}` : cent % 10 === 0 ? `${entero}${sep}${cent / 10}` : `${entero}${sep}${String(cent).padStart(2, '0')}`,
    entero === 0 ? `${sep}${String(cent).padStart(2, '0')}` : `${entero}${sep}${String(cent).padStart(2, '0')}`,
  ];
  for (const v of variantes) {
    const r = n(v);
    if (r.estado !== 'valido' || !MONTO_TEXTO.test(r.normalizado) || desdeTexto(r.normalizado) !== c) {
      prop++; if (prop < 5) console.log('FALLA propiedad', c, v, r);
    }
  }
}
casos++; if (prop) fallos++;
console.log(`V5-01b propiedad: 900.000 textos, ${prop} fallos`);

// --- V5-02a: formatos fijados (04 §7.10) ---------------------------------------
igual('monto 1234.50', formatearMonto(desdeEntero(123450)), '$1,234.50');
igual('monto -45', formatearMonto(desdeEntero(-4500)), '-$45.00');
igual('monto 0.75', formatearMonto(desdeEntero(75)), '$0.75');
igual('monto 0', formatearMonto(desdeEntero(0)), '$0.00');
igual('monto máximo', formatearMonto(desdeEntero(MAX)), '$21,474,836.47');
igual('monto -1 centavo', formatearMonto(desdeEntero(-1)), '-$0.01');
igual('vista previa "12.3"', formatearMontoTexto('12.3'), '$12.30');
igual('fecha', formatearFecha('2026-10-05'), '05/10/2026');
igual('fecha texto', formatearFechaTexto('2026-10-05'), '5 oct 2026');
igual('fecha texto sep', formatearFechaTexto('2026-09-21'), '21 sep 2026');
igual('instante', formatearInstante('2026-10-05T20:32:10.000Z'), '05/10/2026 14:32');
igual('instante cruza medianoche UTC', formatearInstante('2026-10-06T05:59:00.000Z'), '05/10/2026 23:59');
igual('porcentaje 4550 pb', formatearPorcentaje(4550), '45.5%');
igual('porcentaje 10000 pb', formatearPorcentaje(10000), '100%');

// --- V5-02b: propiedad. El camino sin flotantes coincide con una referencia
// construida a mano para cualquier entero; y se mide si el camino con flotante
// (c / 100) llega a diferir.
const referencia = (c: number) => {
  const a = Math.abs(c), e = String(Math.floor(a / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${c < 0 ? '-' : ''}$${e}.${String(a % 100).padStart(2, '0')}`;
};
const flotante = new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' });
let difTexto = 0, difFlotante = 0;
for (let i = 0; i < 400_000; i++) {
  const base = i < 200_000 ? i - 100_000 : Math.floor(azar() * 2 * MAX) - MAX;
  if (formatearMonto(desdeEntero(base)) !== referencia(base)) difTexto++;
  if (flotante.format(base / 100) !== referencia(base)) difFlotante++;
}
casos++; if (difTexto) fallos++;
console.log(`V5-02b: 400.000 montos; texto decimal → ${difTexto} diferencias; c/100 → ${difFlotante} diferencias`);

// --- Observaciones de ICU (no son aserciones) ----------------------------------
const obs = {
  version: process.version, icu: process.versions.icu,
  mesCortoIntl: ['2026-09-15', '2026-10-15'].map((f) =>
    new Intl.DateTimeFormat('es-SV', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${f}T12:00:00Z`))),
  instanteIntlDirecto: new Intl.DateTimeFormat('es-SV', { timeZone: 'America/El_Salvador', day: '2-digit', month: '2-digit',
    year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date('2026-10-05T20:32:10Z')),
  fechaIntl: new Intl.DateTimeFormat('es-SV', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date('2026-10-05T00:00:00Z')),
};
console.log(JSON.stringify(obs));
console.log(`${casos} comprobaciones, ${fallos} fallos`);
process.exit(fallos ? 1 : 0);

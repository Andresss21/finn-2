// V-18: formatos de Intl con es-SV. Ejecutar con Node 24 (en 0.7: Node 24.21, ICU 78.3).
console.log(process.version, process.versions.icu);
const m = new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' });
const f = new Intl.DateTimeFormat('es-SV', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
console.log(m.format(1234.5), m.format(-45), f.format(new Date('2026-10-05T00:00:00Z')));

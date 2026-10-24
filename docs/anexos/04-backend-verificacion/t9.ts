// V-19/V-20: ids secundarios deterministas (UUIDv5) y huella sin ids de filas nuevas.
import { createHash, randomUUID } from 'node:crypto';
function uuidv5(nombre: string, espacio: string): string {
  const ns = Buffer.from(espacio.replace(/-/g, ''), 'hex');
  const h = createHash('sha1').update(Buffer.concat([ns, Buffer.from(nombre, 'utf8')])).digest();
  h[6] = (h[6] & 0x0f) | 0x50; h[8] = (h[8] & 0x3f) | 0x80;
  const x = h.subarray(0, 16).toString('hex');
  return `${x.slice(0,8)}-${x.slice(8,12)}-${x.slice(12,16)}-${x.slice(16,20)}-${x.slice(20)}`;
}
const derivado = (principal: string) => { let i = 0; return { siguiente: () => uuidv5(String(++i), principal) }; };
const aleatorio = () => ({ siguiente: () => randomUUID() });
// "aplicar" simulado: transacción con 3 líneas; el aviso cita las filas nuevas
function aplicar(id: string, gen: { siguiente(): string }) {
  const lineas = [100, 200, 300].map(m => ({ id: gen.siguiente(), monto: m }));
  const nuevos = new Set([id, ...lineas.map(l => l.id)]);
  const impacto = { deltaLpa: 0, deltaDisp: { 'cat-super': -600 }, avisos: [{ aviso: 'AV-01', transaccionId: id, lineas: lineas.map(l => l.id) }] };
  return { lineas, nuevos, impacto };
}
function canonica(v: any, nuevos: Map<string, string>): any {
  if (Array.isArray(v)) return v.map(x => canonica(x, nuevos));
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map(k => [k, canonica(v[k], nuevos)]));
  if (typeof v === 'string' && nuevos.has(v)) return nuevos.get(v);
  return v;
}
function huella(r: ReturnType<typeof aplicar>, excluir: boolean) {
  const marcas = new Map<string, string>(); let k = 0;
  if (excluir) for (const id of r.nuevos) marcas.set(id, `@nueva#${k++}`);
  return createHash('sha256').update(JSON.stringify(canonica(r.impacto, marcas))).digest('hex').slice(0, 16);
}
const principal = randomUUID();
const a = aplicar(principal, derivado(principal)), b = aplicar(principal, derivado(principal)), c = aplicar(randomUUID(), derivado(randomUUID()));
console.log('V-19 ids derivados iguales en previsualizar/confirmar:', JSON.stringify(a.lineas.map(l => l.id)) === JSON.stringify(b.lineas.map(l => l.id)));
console.log('V-19 versión y variante RFC 9562:', a.lineas.every(l => /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(l.id)));
console.log('V-19 otro id principal → ids distintos:', a.lineas[0].id !== c.lineas[0].id);
console.log('V-19 vector conocido (RFC 9562 ejemplo DNS "www.example.com"):', uuidv5('www.example.com', '6ba7b810-9dad-11d1-80b4-00c04fd430c8'));
const p = aplicar(principal, aleatorio()), q = aplicar(principal, aleatorio());
console.log('V-20 generador aleatorio, huella CON ids nuevos: iguales =', huella(p, false) === huella(q, false));
console.log('V-20 generador aleatorio, huella SIN ids nuevos: iguales =', huella(p, true) === huella(q, true));

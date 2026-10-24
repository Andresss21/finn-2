import { consultar } from '@/lib/consultar';
export default async function P({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = await consultar(async () => id === 'existe' ? { ok: true as const, valor: 'hola' } : { ok: false as const, error: { categoria: 'NO_ENCONTRADO' as const, codigo: 'no_encontrado', mensaje: '' } });
  return <p data-testid="cosa">{v}</p>;
}

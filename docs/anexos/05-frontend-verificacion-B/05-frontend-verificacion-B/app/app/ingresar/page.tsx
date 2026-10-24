import { rutaSegura } from '@/lib/consultar';
export default async function I({ searchParams }: { searchParams: Promise<{ volver?: string }> }) {
  const { volver } = await searchParams;
  return <main data-testid="ingresar">volver={rutaSegura(volver ?? null)}</main>;
}

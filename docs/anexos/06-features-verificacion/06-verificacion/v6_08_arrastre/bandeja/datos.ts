export const movimientos = Array.from({ length: 20 }, (_, i) => ({
  id: `m${i + 1}`, comercio: `COMERCIO ${i + 1}`, monto: `$${(10 + i).toFixed(2)}`,
  sugerida: i % 3 === 0 ? null : { id: 'c-super', nombre: 'Supermercado' }, arrastrable: i % 5 !== 4,
}));
export const destinos = {
  frecuentes: [
    { id: 'c-super', nombre: 'Supermercado' }, { id: 'c-rest', nombre: 'Restaurantes' },
    { id: 'c-gas', nombre: 'Gasolina' }, { id: 'c-farm', nombre: 'Farmacia' },
    { id: 'c-cafe', nombre: 'Cafés y antojos' }, { id: 'c-stream', nombre: 'Streaming' },
  ],
};

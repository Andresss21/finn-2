export default function Raiz({ children, superpuesto }: { children: React.ReactNode; superpuesto: React.ReactNode }) {
  return (<html lang="es"><body>{children}<div id="superpuesto">{superpuesto}</div></body></html>);
}

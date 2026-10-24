'use client';
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (<main role="alert"><p data-testid="ref">{error.digest}</p><p data-testid="msg">{error.message}</p>
    <button onClick={() => reset()}>Reintentar</button></main>);
}

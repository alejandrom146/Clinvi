export default function LoadingBuscar() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6" role="status" aria-label="Cargando resultados">
      <div className="h-9 w-56 animate-pulse rounded-xl bg-white" />
      <div className="mt-6 h-14 animate-pulse rounded-full bg-white" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-3xl bg-white" />
        ))}
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="container-luxe py-16">
      <div className="h-6 w-32 animate-pulse bg-cream" />
      <div className="mt-6 h-12 w-2/3 animate-pulse bg-cream" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <div className="aspect-[4/5] animate-pulse bg-cream" />
            <div className="h-4 w-2/3 animate-pulse bg-cream" />
            <div className="h-4 w-1/3 animate-pulse bg-cream" />
          </div>
        ))}
      </div>
    </div>
  );
}

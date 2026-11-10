interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <main className="min-h-screen bg-[var(--kanzler-canvas)] p-6 md:p-10">
      <section className="mx-auto max-w-5xl rounded-[var(--kanzler-radius)] border border-[var(--kanzler-line)] bg-white p-8 shadow-[var(--kanzler-shadow)]">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--kanzler-blue)]">
          Kanzler Cabelos
        </p>
        <h1 className="kanzler-display text-2xl font-bold">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--kanzler-muted)]">{description}</p>
      </section>
    </main>
  );
}

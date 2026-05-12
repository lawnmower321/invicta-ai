import { notFound } from "next/navigation"

export default function DevComponentsPage() {
  if (process.env.NODE_ENV === "production") notFound()

  return (
    <div className="min-h-screen p-8" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <header className="mb-8">
        <div className="text-[10px] tracking-[0.18em] opacity-60 uppercase font-bold mb-1">
          Development
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Component Reference</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Visual reference for every shared component variant in <code>components/invicta/</code>.
          Hidden in production via <code>NODE_ENV</code> guard.
        </p>
      </header>

      <main className="space-y-12">
        {/* Sections will be added progressively as components land. */}
        <div className="text-xs text-muted-foreground">No components added yet.</div>
      </main>
    </div>
  )
}

import { notFound } from "next/navigation"
import { Spinner } from "@/components/invicta/Spinner"

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
        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground pb-2 mb-3 border-b border-white/[0.06]">
            Spinner
          </h2>
          <div className="flex items-center gap-8 flex-wrap">
            <div className="flex items-center gap-2"><Spinner size="xs" /><span className="text-xs">xs · 12px</span></div>
            <div className="flex items-center gap-2"><Spinner size="sm" /><span className="text-xs">sm · 16px (default)</span></div>
            <div className="flex items-center gap-2"><Spinner size="md" /><span className="text-xs">md · 20px</span></div>
            <div className="flex items-center gap-2"><Spinner size="lg" /><span className="text-xs">lg · 24px</span></div>
            <div className="flex items-center gap-2"><Spinner accent="green" /><span className="text-xs">accent green</span></div>
            <div className="flex items-center gap-2"><Spinner accent="amber" /><span className="text-xs">accent amber</span></div>
            <div className="flex items-center gap-2"><Spinner accent="neutral" /><span className="text-xs">accent neutral</span></div>
            <div className="flex items-center gap-2" style={{ color: "var(--invicta-red)" }}>
              <Spinner /><span className="text-xs">currentColor (red parent)</span>
            </div>
            <Spinner size="md" label="Generating campaign..." />
          </div>
        </section>
      </main>
    </div>
  )
}

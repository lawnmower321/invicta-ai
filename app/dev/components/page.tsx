import { notFound } from "next/navigation"
import { Spinner } from "@/components/invicta/Spinner"
import { StatBadge } from "@/components/invicta/StatBadge"
import { StageBadge } from "@/components/invicta/badges/StageBadge"
import { PriorityBadge } from "@/components/invicta/badges/PriorityBadge"
import { SourceBadge } from "@/components/invicta/badges/SourceBadge"
import { SpreadBadge } from "@/components/invicta/badges/SpreadBadge"
import { ScoreBadge } from "@/components/invicta/badges/ScoreBadge"
import { Radio, DollarSign, Users, Inbox, Inbox as InboxIcon, Target } from "lucide-react"
import { KpiCard, KpiGrid } from "@/components/invicta/KpiCard"
import { SectionHeader } from "@/components/invicta/SectionHeader"
import { EmptyState } from "@/components/invicta/EmptyState"
import { EmptyLeads } from "@/components/invicta/empty/EmptyLeads"
import { EmptyResults } from "@/components/invicta/empty/EmptyResults"
import { EmptyPipeline } from "@/components/invicta/empty/EmptyPipeline"

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

        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground pb-2 mb-3 border-b border-white/[0.06]">
            StatBadge — base
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {(["neutral","green","blue","purple","amber","red"] as const).map(a => (
                <StatBadge key={a} label={a} accent={a} />
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <StatBadge label="xs" accent="green" size="xs" />
              <StatBadge label="sm (default)" accent="green" size="sm" />
              <StatBadge label="md" accent="green" size="md" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <StatBadge label="soft" accent="purple" variant="soft" />
              <StatBadge label="outline" accent="purple" variant="outline" />
              <StatBadge label="solid" accent="purple" variant="solid" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <StatBadge label="LIVE" accent="red" pulse />
              <StatBadge label="With icon" accent="blue" icon={Radio} />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground pb-2 mb-3 border-b border-white/[0.06]">
            StatBadge — presets
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {(["new","contacted","qualified","offer","contract","closed"] as const).map(s => (
                <StageBadge key={s} stage={s} />
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <PriorityBadge priority="high" />
              <PriorityBadge priority="medium" />
              <PriorityBadge priority="low" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <SourceBadge source="Zillow" />
              <SourceBadge source="MLS" />
              <SourceBadge source="Driving" />
              <SourceBadge source="Unknown" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <SpreadBadge value={12000} />
              <SpreadBadge value={0} />
              <SpreadBadge value={-3500} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <ScoreBadge score={9} />
              <ScoreBadge score={6} />
              <ScoreBadge score={3} />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground pb-2 mb-3 border-b border-white/[0.06]">
            KpiCard — default (4-up grid)
          </h2>
          <KpiGrid cols={4}>
            <KpiCard label="Pipeline Value" value={124000} format="currency" icon={DollarSign} accent="green" trend={{ dir: "up", value: "+12%" }} />
            <KpiCard label="Active Leads"   value={47}     icon={Users}      accent="blue"  trend={{ dir: "flat", value: "no change" }} />
            <KpiCard label="In Pool"        value={132}    icon={Inbox}      accent="amber" trend={{ dir: "down", value: "-4" }} />
            <KpiCard label="Deals Closed"   value={9}      icon={Target}     accent="purple" hint="this quarter" />
          </KpiGrid>
        </section>

        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground pb-2 mb-3 border-b border-white/[0.06]">
            KpiCard — feature variant + loading + href
          </h2>
          <KpiGrid cols={3}>
            <KpiCard label="Suggested ARV" value={245000} format="currency" icon={DollarSign} accent="green" variant="feature" />
            <KpiCard label="Loading State" value={0} loading accent="purple" />
            <KpiCard label="Clickable" value={"Pipeline →"} accent="blue" href="/pipeline" />
          </KpiGrid>
        </section>
        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground pb-2 mb-3 border-b border-white/[0.06]">
            SectionHeader
          </h2>
          <div className="space-y-6">
            <SectionHeader title="Team Performance" count={4} />
            <SectionHeader title="Property Numbers" eyebrow="Workspace" hint="all values are live" />
            <SectionHeader
              title="Filters"
              count={12}
              accent="purple"
              action={<button className="text-xs px-2 py-1 rounded-md border border-white/[0.08]">+ Add</button>}
            />
            <SectionHeader title="Compact" size="sm" />
            <div style={{ "--page-accent": "var(--invicta-amber)" } as React.CSSProperties}>
              <SectionHeader title="Inherits Amber" count={7} />
            </div>
            <SectionHeader title="No Divider" count={3} divider={false} />
          </div>
        </section>

        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground pb-2 mb-3 border-b border-white/[0.06]">
            EmptyState — sizes
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <EmptyState icon={InboxIcon} title="Compact" size="compact" />
            <EmptyState icon={InboxIcon} title="Small" size="sm" description="For empty columns and drawers." />
            <EmptyState icon={InboxIcon} title="Medium (default)" description="Default page-level empty content." action={{ label: "+ Add", onClick: () => {} }} />
            <EmptyState icon={InboxIcon} title="Large" size="lg" description="Whole-page empty state with a wider description." action={{ label: "Get started", onClick: () => {} }} secondaryAction={{ label: "Learn more", href: "/learn" }} />
          </div>
        </section>

        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground pb-2 mb-3 border-b border-white/[0.06]">
            EmptyState — presets
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <EmptyLeads onAdd={() => {}} />
            <EmptyResults query="123 elm" />
            <EmptyPipeline stage="qualified" />
          </div>
        </section>
      </main>
    </div>
  )
}

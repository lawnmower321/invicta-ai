import Link from "next/link";
import {
  Kanban, Users, TrendingUp, Calculator,
  Bell, Radio, BarChart3, ArrowUpRight,
  DollarSign, Target, Clock, Zap,
} from "lucide-react";

const bentoTiles = [
  {
    href: "/pipeline",
    label: "Pipeline",
    icon: Kanban,
    description: "Track deals across stages",
    accent: "var(--invicta-green)",
    stat: "7 active",
    size: "large",
  },
  {
    href: "/buyers",
    label: "Cash Buyers",
    icon: Users,
    description: "Your buyer network",
    accent: "var(--invicta-blue)",
    stat: "24 buyers",
    size: "small",
  },
  {
    href: "/followups",
    label: "Follow-ups",
    icon: Bell,
    description: "Tasks due today",
    accent: "var(--invicta-amber)",
    stat: "3 due",
    size: "small",
  },
  {
    href: "/comps",
    label: "Comps Tool",
    icon: TrendingUp,
    description: "Run property comps instantly",
    accent: "var(--invicta-purple)",
    stat: "Find ARV",
    size: "medium",
  },
  {
    href: "/calculator",
    label: "Deal Calculator",
    icon: Calculator,
    description: "MAO & assignment fee",
    accent: "var(--invicta-green)",
    stat: "Run numbers",
    size: "medium",
  },
  {
    href: "/scraper",
    label: "Scraper",
    icon: Radio,
    description: "Auto-find motivated sellers",
    accent: "var(--invicta-red)",
    stat: "12 new",
    size: "small",
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: BarChart3,
    description: "KPIs & performance",
    accent: "var(--invicta-blue)",
    stat: "This month",
    size: "small",
  },
];

const kpis = [
  { label: "Pipeline Value", value: "$0", icon: DollarSign, accent: "var(--invicta-green)" },
  { label: "Active Leads", value: "0", icon: Target, accent: "var(--invicta-blue)" },
  { label: "Follow-ups Due", value: "0", icon: Clock, accent: "var(--invicta-amber)" },
  { label: "Deals Closed", value: "0", icon: Zap, accent: "var(--invicta-purple)" },
];

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-[1200px]">

      {/* header */}
      <div className="mb-8">
        <p className="text-xs font-bold tracking-widest uppercase mb-1"
          style={{ color: "var(--muted-foreground)" }}>
          Welcome back
        </p>
        <h1 className="text-3xl font-bold tracking-wide">Command Center</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          Invicta.ai — Unconquered
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {kpis.map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="rounded-2xl border p-4 flex items-center gap-4 transition-all hover:border-opacity-60"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${accent}20` }}>
              <Icon size={18} style={{ color: accent }} />
            </div>
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* bento grid */}
      <div className="grid grid-cols-3 grid-rows-[auto_auto] gap-4">

        {/* large tile - pipeline */}
        <Link href="/pipeline"
          className="col-span-1 row-span-2 rounded-2xl border p-6 flex flex-col justify-between group transition-all hover:border-opacity-80 cursor-pointer"
          style={{ background: "var(--surface)", borderColor: "var(--border)", minHeight: "260px" }}>
          <div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "var(--invicta-green)20" }}>
              <Kanban size={22} style={{ color: "var(--invicta-green)" }} />
            </div>
            <h2 className="text-xl font-bold mb-1">Pipeline</h2>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Track every deal from first contact to closing
            </p>
          </div>
          <div className="flex items-center justify-between mt-6">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ background: "var(--invicta-green)20", color: "var(--invicta-green)" }}>
              7 active deals
            </span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              style={{ background: "var(--invicta-green)20" }}>
              <ArrowUpRight size={14} style={{ color: "var(--invicta-green)" }} />
            </div>
          </div>
        </Link>

        {/* comps */}
        <Link href="/comps"
          className="col-span-1 rounded-2xl border p-5 flex flex-col justify-between group transition-all hover:border-opacity-80 cursor-pointer"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: "var(--invicta-purple)20" }}>
                <TrendingUp size={18} style={{ color: "var(--invicta-purple)" }} />
              </div>
              <h2 className="text-lg font-bold">Comps Tool</h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                Run ARV comps instantly
              </p>
            </div>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              style={{ background: "var(--invicta-purple)20" }}>
              <ArrowUpRight size={13} style={{ color: "var(--invicta-purple)" }} />
            </div>
          </div>
        </Link>

        {/* calculator */}
        <Link href="/calculator"
          className="col-span-1 rounded-2xl border p-5 flex flex-col justify-between group transition-all hover:border-opacity-80 cursor-pointer"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: "var(--invicta-green)20" }}>
                <Calculator size={18} style={{ color: "var(--invicta-green)" }} />
              </div>
              <h2 className="text-lg font-bold">Deal Calculator</h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                MAO & assignment fee math
              </p>
            </div>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              style={{ background: "var(--invicta-green)20" }}>
              <ArrowUpRight size={13} style={{ color: "var(--invicta-green)" }} />
            </div>
          </div>
        </Link>

        {/* buyers */}
        <Link href="/buyers"
          className="col-span-1 rounded-2xl border p-5 flex items-center gap-4 group transition-all hover:border-opacity-80 cursor-pointer"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--invicta-blue)20" }}>
            <Users size={18} style={{ color: "var(--invicta-blue)" }} />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold">Cash Buyers</h2>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>24 in network</p>
          </div>
          <ArrowUpRight size={14} style={{ color: "var(--muted-foreground)" }}
            className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>

        {/* followups */}
        <Link href="/followups"
          className="col-span-1 rounded-2xl border p-5 flex items-center gap-4 group transition-all hover:border-opacity-80 cursor-pointer"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--invicta-amber)20" }}>
            <Bell size={18} style={{ color: "var(--invicta-amber)" }} />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold">Follow-ups</h2>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>3 due today</p>
          </div>
          <ArrowUpRight size={14} style={{ color: "var(--muted-foreground)" }}
            className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>

        {/* scraper */}
        <Link href="/scraper"
          className="col-span-1 rounded-2xl border p-5 flex items-center gap-4 group transition-all hover:border-opacity-80 cursor-pointer"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative"
            style={{ background: "var(--invicta-red)20" }}>
            <Radio size={18} style={{ color: "var(--invicta-red)" }} />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 animate-pulse"
              style={{ background: "var(--invicta-red)", borderColor: "var(--surface)" }} />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold">Scraper</h2>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>12 new leads found</p>
          </div>
          <ArrowUpRight size={14} style={{ color: "var(--muted-foreground)" }}
            className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>

        {/* analytics */}
        <Link href="/analytics"
          className="col-span-1 rounded-2xl border p-5 flex items-center gap-4 group transition-all hover:border-opacity-80 cursor-pointer"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--invicta-blue)20" }}>
            <BarChart3 size={18} style={{ color: "var(--invicta-blue)" }} />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold">Analytics</h2>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>KPIs & performance</p>
          </div>
          <ArrowUpRight size={14} style={{ color: "var(--muted-foreground)" }}
            className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

"use client";

import {
  DollarSign, TrendingUp, Users, Target, Zap,
  Clock, ArrowUpRight, ArrowDownRight, BarChart3,
} from "lucide-react";

const KPI_CARDS = [
  { label: "Total Pipeline Value",  value: "$1,091,000", change: "+18%",   up: true,  color: "var(--invicta-green)",  icon: DollarSign },
  { label: "Deals Under Contract",  value: "1",          change: "+1",     up: true,  color: "var(--invicta-blue)",   icon: Target },
  { label: "Avg Days to Contract",  value: "21 days",    change: "-3d",    up: true,  color: "var(--invicta-purple)", icon: Clock },
  { label: "Leads This Month",      value: "14",         change: "+6",     up: true,  color: "var(--invicta-amber)",  icon: TrendingUp },
  { label: "Buyers in Network",     value: "24",         change: "+3",     up: true,  color: "var(--invicta-blue)",   icon: Users },
  { label: "Assignment Fees (est)", value: "$38,000",    change: "YTD",    up: true,  color: "var(--invicta-green)",  icon: Zap },
];

const PIPELINE_STAGES = [
  { label: "New Lead",        count: 2, value: 0,       color: "var(--invicta-blue)",   pct: 30 },
  { label: "Contacted",       count: 1, value: 185000,  color: "var(--invicta-amber)",  pct: 55 },
  { label: "Qualified",       count: 1, value: 140000,  color: "var(--invicta-purple)", pct: 40 },
  { label: "Offer Made",      count: 1, value: 165000,  color: "var(--invicta-green)",  pct: 75 },
  { label: "Under Contract",  count: 1, value: 178000,  color: "var(--invicta-green)",  pct: 90 },
  { label: "Closed",          count: 1, value: 155000,  color: "var(--invicta-red)",    pct: 100 },
];

const MONTHLY_LEADS = [
  { month: "Nov", leads: 3,  value: 4 },
  { month: "Dec", leads: 2,  value: 2 },
  { month: "Jan", leads: 5,  value: 7 },
  { month: "Feb", leads: 7,  value: 9 },
  { month: "Mar", leads: 9,  value: 12 },
  { month: "Apr", leads: 14, value: 18 },
];

const SOURCES = [
  { name: "Cold Call",   pct: 42, color: "var(--invicta-blue)" },
  { name: "Scraper",     pct: 29, color: "var(--invicta-purple)" },
  { name: "Referral",    pct: 18, color: "var(--invicta-green)" },
  { name: "Direct Mail", pct: 11, color: "var(--invicta-amber)" },
];

const maxLeads = Math.max(...MONTHLY_LEADS.map(m => m.value));

function fmt(n: number) { return "$" + n.toLocaleString(); }

export default function AnalyticsPage() {
  return (
    <div className="p-8 max-w-[1100px]">
      {/* header */}
      <div className="mb-8">
        <p className="text-xs font-bold tracking-widest uppercase mb-1"
          style={{ color: "var(--muted-foreground)" }}>
          Performance
        </p>
        <h1 className="text-3xl font-bold tracking-wide">Analytics</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          KPIs, pipeline health, and deal velocity
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {KPI_CARDS.map(({ label, value, change, up, color, icon: Icon }) => (
          <div key={label} className="rounded-2xl border p-5 flex items-start justify-between"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div>
              <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>{label}</p>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              <div className="flex items-center gap-1 mt-1">
                {up
                  ? <ArrowUpRight size={12} style={{ color: "var(--invicta-green)" }} />
                  : <ArrowDownRight size={12} style={{ color: "var(--invicta-red)" }} />}
                <span className="text-xs font-bold"
                  style={{ color: up ? "var(--invicta-green)" : "var(--invicta-red)" }}>
                  {change}
                </span>
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>vs last month</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}15` }}>
              <Icon size={18} style={{ color }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* monthly bar chart */}
        <div className="col-span-2 rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <h2 className="font-bold mb-1">Lead Volume</h2>
          <p className="text-xs mb-5" style={{ color: "var(--muted-foreground)" }}>Leads entered per month</p>
          <div className="flex items-end gap-3 h-36">
            {MONTHLY_LEADS.map(({ month, leads, value }) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-bold" style={{ color: "var(--invicta-green)" }}>{leads}</span>
                <div className="w-full rounded-t-lg transition-all"
                  style={{
                    height: `${(value / maxLeads) * 100}%`,
                    minHeight: 8,
                    background: `linear-gradient(to top, var(--invicta-green), var(--invicta-blue))`,
                    opacity: 0.85,
                  }} />
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* lead sources */}
        <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <h2 className="font-bold mb-1">Lead Sources</h2>
          <p className="text-xs mb-5" style={{ color: "var(--muted-foreground)" }}>Where leads come from</p>
          <div className="flex flex-col gap-3">
            {SOURCES.map(({ name, pct, color }) => (
              <div key={name}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-bold">{name}</span>
                  <span className="text-xs font-bold" style={{ color }}>{pct}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full" style={{ background: "var(--surface-3)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* pipeline funnel */}
        <div className="col-span-3 rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <h2 className="font-bold mb-1">Pipeline by Stage</h2>
          <p className="text-xs mb-5" style={{ color: "var(--muted-foreground)" }}>Deal count and value per stage</p>
          <div className="flex flex-col gap-3">
            {PIPELINE_STAGES.map(({ label, count, value, color, pct }) => (
              <div key={label} className="flex items-center gap-4">
                <div className="w-32 flex-shrink-0">
                  <p className="text-xs font-bold">{label}</p>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {count} deal{count !== 1 ? "s" : ""}
                    {value > 0 ? ` · ${fmt(value)}` : ""}
                  </p>
                </div>
                <div className="flex-1 h-2 rounded-full" style={{ background: "var(--surface-3)" }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: color }} />
                </div>
                <span className="text-xs font-bold w-10 text-right flex-shrink-0" style={{ color }}>
                  {pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

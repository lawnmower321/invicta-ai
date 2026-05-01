"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Kanban, Users, TrendingUp, Calculator,
  Bell, Radio, BarChart3, ArrowUpRight,
  DollarSign, Target, Inbox, Zap,
} from "lucide-react";

const supabase = createClient();

export default function DashboardPage() {
  const [displayName, setDisplayName] = useState("there");
  const [kpis, setKpis] = useState({ pipelineValue: 0, activeLeads: 0, poolCount: 0, closedDeals: 0 });
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (!uid) return;
      const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", uid).single();
      if (profile?.display_name) setDisplayName(profile.display_name);
      const { data: leads } = await supabase.from("leads").select("stage, ask_price, assigned_to");
      if (leads) {
        const mine = leads.filter(l => l.assigned_to === uid);
        setKpis({
          pipelineValue: mine.filter(l => l.ask_price && l.stage !== "closed").reduce((s, l) => s + (l.ask_price ?? 0), 0),
          activeLeads:   mine.filter(l => l.stage !== "closed").length,
          poolCount:     leads.filter(l => !l.assigned_to).length,
          closedDeals:   mine.filter(l => l.stage === "closed").length,
        });
      }
    });
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden px-5 pt-6 pb-8 md:px-8 md:pt-10">
        {/* glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, var(--invicta-green) 0%, transparent 70%)" }} />
        </div>
        <p className="text-xs font-bold tracking-widest uppercase mb-1 relative"
          style={{ color: "var(--muted-foreground)" }}>Welcome back</p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-wide relative mb-1">{displayName}</h1>
        <p className="text-sm relative" style={{ color: "var(--muted-foreground)" }}>Invicta.ai — Unconquered</p>
      </div>

      {/* ── KPI strip ── */}
      <div className="px-5 md:px-8 mb-6">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Pipeline Value", value: kpis.pipelineValue > 0 ? "$" + kpis.pipelineValue.toLocaleString() : "$0", icon: DollarSign, color: "var(--invicta-green)" },
            { label: "Active Leads",   value: String(kpis.activeLeads),  icon: Target,  color: "var(--invicta-blue)" },
            { label: "Pool",           value: String(kpis.poolCount),    icon: Inbox,   color: "var(--invicta-amber)" },
            { label: "Closed",         value: String(kpis.closedDeals),  icon: Zap,     color: "var(--invicta-purple)" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl border p-4 flex items-center gap-3"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}18` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold leading-none mb-0.5" style={{ color }}>{value}</p>
                <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main tiles ── */}
      <div className="px-5 md:px-8 flex flex-col gap-3 pb-6">

        {/* Pipeline — hero tile */}
        <Link href="/pipeline"
          className="relative rounded-3xl overflow-hidden border group"
          style={{ background: "var(--surface)", borderColor: "var(--invicta-green)30" }}>
          <div className="absolute inset-0 opacity-5 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at top left, var(--invicta-green), transparent 60%)" }} />
          <div className="relative p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--invicta-green)20" }}>
              <Kanban size={26} style={{ color: "var(--invicta-green)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold mb-0.5">Pipeline</h2>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                {kpis.activeLeads} active · {kpis.poolCount} in pool
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              style={{ background: "var(--invicta-green)20" }}>
              <ArrowUpRight size={16} style={{ color: "var(--invicta-green)" }} />
            </div>
          </div>
        </Link>

        {/* Scraper — live tile */}
        <Link href="/scraper"
          className="relative rounded-3xl overflow-hidden border group"
          style={{ background: "var(--surface)", borderColor: "var(--invicta-red)30" }}>
          <div className="absolute inset-0 opacity-5 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at top right, var(--invicta-red), transparent 60%)" }} />
          <div className="relative p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 relative"
              style={{ background: "var(--invicta-red)20" }}>
              <Radio size={26} style={{ color: "var(--invicta-red)" }} />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full border-2 animate-pulse"
                style={{ background: "var(--invicta-red)", borderColor: "var(--surface)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-xl font-bold">Scraper</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full animate-pulse"
                  style={{ background: "var(--invicta-red)20", color: "var(--invicta-red)" }}>
                  LIVE
                </span>
              </div>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                Auto-find motivated sellers
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              style={{ background: "var(--invicta-red)20" }}>
              <ArrowUpRight size={16} style={{ color: "var(--invicta-red)" }} />
            </div>
          </div>
        </Link>

        {/* 2-col row */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: "/comps",      label: "Comps",      icon: TrendingUp, color: "var(--invicta-purple)", desc: "Run ARV" },
            { href: "/calculator", label: "Calculator", icon: Calculator,  color: "var(--invicta-green)",  desc: "MAO math" },
            { href: "/buyers",     label: "Buyers",     icon: Users,       color: "var(--invicta-blue)",   desc: "Your network" },
            { href: "/analytics",  label: "Analytics",  icon: BarChart3,   color: "var(--invicta-blue)",   desc: "KPIs" },
          ].map(({ href, label, icon: Icon, color, desc }) => (
            <Link key={href} href={href}
              className="rounded-2xl border p-4 flex flex-col gap-3 group transition-all"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${color}18` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <ArrowUpRight size={13} className="opacity-30 group-hover:opacity-70 transition-opacity"
                  style={{ color }} />
              </div>
              <div>
                <p className="font-bold text-sm">{label}</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Follow-ups — full width */}
        <Link href="/followups"
          className="rounded-3xl border p-5 flex items-center gap-4 group"
          style={{ background: "var(--surface)", borderColor: "var(--invicta-amber)30" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--invicta-amber)20" }}>
            <Bell size={22} style={{ color: "var(--invicta-amber)" }} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold">Follow-ups</h2>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Tasks & reminders</p>
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--invicta-amber)20" }}>
            <ArrowUpRight size={16} style={{ color: "var(--invicta-amber)" }} />
          </div>
        </Link>

      </div>
    </div>
  );
}

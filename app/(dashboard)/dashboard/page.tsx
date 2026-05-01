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

const tiles = [
  {
    href: "/pipeline",
    label: "Pipeline",
    icon: Kanban,
    color: "#00e676",
    desc: "Leads & deals",
    span: "col-span-2 md:col-span-2",
    tall: true,
  },
  {
    href: "/scraper",
    label: "Scraper",
    icon: Radio,
    color: "#ff5252",
    desc: "Find sellers",
    live: true,
    span: "col-span-1",
  },
  {
    href: "/comps",
    label: "Comps",
    icon: TrendingUp,
    color: "#e040fb",
    desc: "Run ARV",
    span: "col-span-1",
  },
  {
    href: "/calculator",
    label: "Calculator",
    icon: Calculator,
    color: "#00e676",
    desc: "MAO & fees",
    span: "col-span-1",
  },
  {
    href: "/buyers",
    label: "Buyers",
    icon: Users,
    color: "#448aff",
    desc: "Your network",
    span: "col-span-1",
  },
  {
    href: "/followups",
    label: "Follow-ups",
    icon: Bell,
    color: "#ffab40",
    desc: "Tasks due",
    span: "col-span-1",
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: BarChart3,
    color: "#448aff",
    desc: "KPIs",
    span: "col-span-1",
  },
];

export default function DashboardPage() {
  const [displayName, setDisplayName] = useState("there");
  const [kpis, setKpis] = useState({ pipelineValue: 0, activeLeads: 0, poolCount: 0, closedDeals: 0 });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null;
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
    <div className="p-5 md:p-8 max-w-[900px] mx-auto">

      {/* header */}
      <div className="mb-7">
        <p className="text-xs font-bold tracking-widest uppercase mb-1"
          style={{ color: "var(--muted-foreground)" }}>Command Center</p>
        <h1 className="text-2xl md:text-3xl font-bold tracking-wide">{displayName}</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-2 md:gap-3 mb-5">
        {[
          { label: "Value",   value: kpis.pipelineValue > 0 ? "$" + (kpis.pipelineValue / 1000).toFixed(0) + "k" : "—", icon: DollarSign, color: "#00e676" },
          { label: "Active",  value: String(kpis.activeLeads),  icon: Target,  color: "#448aff" },
          { label: "Pool",    value: String(kpis.poolCount),    icon: Inbox,   color: "#ffab40" },
          { label: "Closed",  value: String(kpis.closedDeals),  icon: Zap,     color: "#e040fb" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border p-3 flex flex-col gap-2"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: `${color}18` }}>
              <Icon size={13} style={{ color }} />
            </div>
            <div>
              <p className="font-bold text-base leading-none mb-0.5">{value}</p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* bento grid */}
      <div className="grid grid-cols-3 gap-2 md:gap-3 auto-rows-[140px] md:auto-rows-[160px]">
        {tiles.map(({ href, label, icon: Icon, color, desc, live, span, tall }) => (
          <Link
            key={href}
            href={href}
            className={`${span} ${tall ? "row-span-2" : ""} rounded-2xl border flex flex-col justify-between p-4 md:p-5 group transition-all hover:border-opacity-60 relative overflow-hidden`}
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            {/* subtle top glow */}
            <div className="absolute top-0 left-0 right-0 h-px opacity-30"
              style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />

            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center relative"
                style={{ background: `${color}15` }}>
                <Icon size={18} style={{ color }} />
                {live && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 animate-pulse"
                    style={{ background: color, borderColor: "var(--surface)" }} />
                )}
              </div>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                style={{ background: "var(--surface-2)" }}>
                <ArrowUpRight size={13} style={{ color: "var(--muted-foreground)" }} />
              </div>
            </div>

            <div>
              {live && (
                <span className="inline-flex items-center gap-1 text-xs font-bold mb-1"
                  style={{ color }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
                  LIVE
                </span>
              )}
              <p className="font-bold text-base leading-tight">{label}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{desc}</p>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Kanban, Users, TrendingUp, Calculator,
  Bell, Radio, BarChart3, ArrowUpRight,
  DollarSign, Target, Inbox, Zap,
} from "lucide-react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import { staggerContainer, staggerContainerFast, fadeUp } from "@/lib/animations";

const supabase = createClient();
const MotionLink = motion(Link);

const tiles = [
  { href: "/pipeline",  label: "Pipeline",   icon: Kanban,    color: "var(--invicta-green)",  desc: "Leads & deals",  span: "col-span-2 md:col-span-2", tall: true },
  { href: "/scraper",   label: "Scraper",    icon: Radio,     color: "var(--invicta-red)",    desc: "Find sellers",  live: true, span: "col-span-1" },
  { href: "/comps",     label: "Comps",      icon: TrendingUp,color: "var(--invicta-purple)", desc: "Run ARV",       span: "col-span-1" },
  { href: "/calculator",label: "Calculator", icon: Calculator, color: "var(--invicta-green)", desc: "MAO & fees",    span: "col-span-1" },
  { href: "/buyers",    label: "Buyers",     icon: Users,     color: "var(--invicta-blue)",   desc: "Your network",  span: "col-span-1" },
  { href: "/followups", label: "Follow-ups", icon: Bell,      color: "var(--invicta-amber)",  desc: "Tasks due",     span: "col-span-1" },
  { href: "/analytics", label: "Analytics",  icon: BarChart3, color: "var(--invicta-blue)",   desc: "KPIs",          span: "col-span-1" },
];

const kpiConfig = [
  { key: "pipelineValue" as const, label: "Value",  icon: DollarSign, color: "var(--invicta-green)"  },
  { key: "activeLeads"   as const, label: "Active", icon: Target,     color: "var(--invicta-blue)"   },
  { key: "poolCount"     as const, label: "Pool",   icon: Inbox,      color: "var(--invicta-amber)"  },
  { key: "closedDeals"   as const, label: "Closed", icon: Zap,        color: "var(--invicta-purple)" },
];

// Count-up for a single numeric KPI value
function CountUp({ target, format }: { target: number; format?: "currency" | "plain" }) {
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, v => {
    const n = Math.round(v);
    if (format === "currency") return n > 0 ? "$" + (n / 1000).toFixed(0) + "k" : "—";
    return String(n);
  });

  useEffect(() => {
    const controls = animate(motionValue, target, { duration: 0.7, ease: "easeOut" });
    return controls.stop;
  }, [target, motionValue]);

  return <motion.span>{display}</motion.span>;
}

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
    <div className="relative min-h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Multi-accent ambient glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-48 -left-24 w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{ background: "var(--invicta-green)", opacity: 0.06 }} />
        <div className="absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full blur-[120px]"
          style={{ background: "var(--invicta-blue)", opacity: 0.05 }} />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full blur-[140px]"
          style={{ background: "var(--invicta-purple)", opacity: 0.04 }} />
        <div className="absolute -bottom-32 right-1/4 w-[350px] h-[350px] rounded-full blur-[120px]"
          style={{ background: "var(--invicta-amber)", opacity: 0.04 }} />
      </div>

      <div className="relative z-10 p-5 md:p-8">
        {/* header */}
        <motion.div
          className="mb-7"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <p className="text-xs font-bold tracking-widest uppercase mb-1"
            style={{ color: "var(--muted-foreground)" }}>Command Center</p>
          <h1 className="text-2xl md:text-3xl font-bold">{displayName}</h1>
        </motion.div>

        {/* KPI row — staggered entrance */}
        <motion.div
          className="grid grid-cols-4 gap-2 md:gap-3 mb-5"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {kpiConfig.map(({ key, label, icon: Icon, color }) => (
            <motion.div
              key={label}
              variants={fadeUp}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="rounded-2xl border p-3 flex flex-col gap-2 backdrop-blur-md"
              style={{ background: "var(--surface-glass)", borderColor: "rgb(255 255 255 / 0.08)" }}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}>
                <Icon size={13} style={{ color }} />
              </div>
              <div>
                <p className="font-bold font-mono tabular-nums text-base leading-none mb-0.5">
                  <CountUp
                    target={kpis[key]}
                    format={key === "pipelineValue" ? "currency" : "plain"}
                  />
                </p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bento grid — staggered entrance */}
        <motion.div
          className="grid grid-cols-3 gap-2 md:gap-3 auto-rows-[140px] md:auto-rows-[160px]"
          variants={staggerContainerFast}
          initial="hidden"
          animate="show"
        >
          {tiles.map(({ href, label, icon: Icon, color, desc, live, span, tall }) => (
            <motion.div
              key={href}
              variants={fadeUp}
              className={`${span} ${tall ? "row-span-2" : ""}`}
            >
              <MotionLink
                href={href}
                className="h-full rounded-2xl border flex flex-col justify-between p-4 md:p-5 group relative overflow-hidden backdrop-blur-md"
                style={{ background: "var(--surface-glass)", borderColor: "rgb(255 255 255 / 0.08)" }}
                whileHover={{ y: -2, borderColor: "rgb(255 255 255 / 0.16)" }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                {/* top glow line */}
                <div className="absolute top-0 left-0 right-0 h-px opacity-30"
                  style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />

                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center relative"
                    style={{ background: `color-mix(in srgb, ${color} 14%, transparent)` }}>
                    <Icon size={18} style={{ color }} />
                    {live && (
                      <motion.span
                        className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2"
                        style={{ background: color, borderColor: "var(--surface)" }}
                        animate={{ scale: [1, 1.35, 1], opacity: [1, 0.4, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}
                  </div>
                  <motion.div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: "var(--surface-2)" }}
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                  >
                    <ArrowUpRight size={13} style={{ color: "var(--muted-foreground)" }} />
                  </motion.div>
                </div>

                <div>
                  {live && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold mb-1"
                      style={{ color }}>
                      <motion.span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: color }}
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                      />
                      LIVE
                    </span>
                  )}
                  <p className="font-bold text-base leading-tight">{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{desc}</p>
                </div>
              </MotionLink>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

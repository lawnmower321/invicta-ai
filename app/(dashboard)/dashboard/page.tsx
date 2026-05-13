"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Kanban, Users, TrendingUp, Calculator,
  Bell, Radio, BarChart3, ArrowUpRight,
  DollarSign, Target, Inbox, Zap,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import PageShell from "@/components/PageShell";
import {
  KpiCard, KpiGrid, SectionHeader,
  accent as accentToken,
  type AccentColor,
} from "@/components/invicta";
import {
  fadeUp, staggerContainerFast, cardHoverY, quickTransition,
} from "@/lib/animations";

const supabase = createClient();
const MotionLink = motion(Link);

type Tile = {
  href: string;
  label: string;
  icon: LucideIcon;
  accent: AccentColor;
  desc: string;
  live?: boolean;
};

const WORKFLOW_TILES: Tile[] = [
  { href: "/pipeline", label: "Pipeline", icon: Kanban, accent: "green",  desc: "Leads & deals" },
  { href: "/scraper",  label: "Scraper",  icon: Radio,  accent: "red",    desc: "Find sellers", live: true },
  { href: "/buyers",   label: "Buyers",   icon: Users,  accent: "blue",   desc: "Your network" },
];

const TOOLS_TILES: Tile[] = [
  { href: "/comps",      label: "Comps",      icon: TrendingUp, accent: "purple", desc: "Run ARV" },
  { href: "/calculator", label: "Calculator", icon: Calculator, accent: "green",  desc: "MAO & fees" },
  { href: "/followups",  label: "Follow-ups", icon: Bell,       accent: "amber",  desc: "Tasks due" },
  { href: "/analytics",  label: "Analytics",  icon: BarChart3,  accent: "blue",   desc: "KPIs" },
];

function FeatureTile({ href, label, icon: Icon, accent: accentName, desc, live }: Tile) {
  const tok = accentToken(accentName);
  return (
    <motion.div variants={fadeUp} className="h-full">
      <MotionLink
        href={href}
        data-glass
        className="block h-full rounded-2xl border border-white/[0.08] p-4 md:p-5 group relative overflow-hidden hover:border-white/[0.16]"
        style={{ background: "var(--surface-glass)" }}
        whileHover={cardHoverY}
        transition={quickTransition}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px opacity-30"
          style={{ background: `linear-gradient(90deg, transparent, ${tok.solid}, transparent)` }}
          aria-hidden="true"
        />

        <div className="flex items-start justify-between">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center relative"
            style={{ background: tok.soft }}
          >
            <Icon size={18} style={{ color: tok.fg }} />
            {live && (
              <motion.span
                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2"
                style={{ background: tok.solid, borderColor: "var(--surface)" }}
                animate={{ scale: [1, 1.35, 1], opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </div>
          <motion.div
            className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100"
            style={{ background: "var(--surface-2)" }}
            transition={quickTransition}
          >
            <ArrowUpRight size={13} className="text-muted-foreground" />
          </motion.div>
        </div>

        <div className="mt-6">
          {live && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] mb-1"
              style={{ color: tok.fg }}
            >
              <motion.span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: tok.solid }}
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
              Live
            </span>
          )}
          <p className="font-bold text-base leading-tight">{label}</p>
          <p className="text-xs mt-0.5 text-muted-foreground">{desc}</p>
        </div>
      </MotionLink>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [displayName, setDisplayName] = useState("there");
  const [kpis, setKpis] = useState({ pipelineValue: 0, activeLeads: 0, poolCount: 0, closedDeals: 0 });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null;
      if (!uid) return;
      const { data: profile } = await supabase
        .from("profiles").select("display_name").eq("id", uid).single();
      if (profile?.display_name) setDisplayName(profile.display_name);
      const { data: leads } = await supabase
        .from("leads").select("stage, ask_price, assigned_to");
      if (leads) {
        const mine = leads.filter(l => l.assigned_to === uid);
        setKpis({
          pipelineValue: mine
            .filter(l => l.ask_price && l.stage !== "closed")
            .reduce((s, l) => s + (l.ask_price ?? 0), 0),
          activeLeads: mine.filter(l => l.stage !== "closed").length,
          poolCount:   leads.filter(l => !l.assigned_to).length,
          closedDeals: mine.filter(l => l.stage === "closed").length,
        });
      }
    });
  }, []);

  return (
    <PageShell
      eyebrow="Command Center"
      title={displayName}
      accent="green"
    >
      <KpiGrid cols={4}>
        <KpiCard
          label="Value"
          value={kpis.pipelineValue}
          format="currency"
          icon={DollarSign}
          accent="green"
        />
        <KpiCard
          label="Active"
          value={kpis.activeLeads}
          format="number"
          icon={Target}
          accent="blue"
        />
        <KpiCard
          label="Pool"
          value={kpis.poolCount}
          format="number"
          icon={Inbox}
          accent="amber"
        />
        <KpiCard
          label="Closed"
          value={kpis.closedDeals}
          format="number"
          icon={Zap}
          accent="purple"
        />
      </KpiGrid>

      <section className="mt-6">
        <SectionHeader title="Workflow" eyebrow="Daily flow" accent="green" />
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-fr"
          variants={staggerContainerFast}
          initial="hidden"
          animate="show"
        >
          {WORKFLOW_TILES.map(t => <FeatureTile key={t.href} {...t} />)}
        </motion.div>
      </section>

      <section className="mt-6">
        <SectionHeader title="Tools" eyebrow="Analyze & follow up" accent="blue" />
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 auto-rows-fr"
          variants={staggerContainerFast}
          initial="hidden"
          animate="show"
        >
          {TOOLS_TILES.map(t => <FeatureTile key={t.href} {...t} />)}
        </motion.div>
      </section>
    </PageShell>
  );
}

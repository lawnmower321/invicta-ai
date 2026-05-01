"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { DollarSign, TrendingUp, Users, Target, Zap, Clock, Loader2 } from "lucide-react";

const supabase = createClient();

const STAGE_ORDER = ["new", "contacted", "qualified", "offer", "contract", "closed"];
const STAGE_LABELS: Record<string, string> = {
  new: "New", contacted: "Contacted", qualified: "Qualified",
  offer: "Offer Made", contract: "Under Contract", closed: "Closed",
};
const STAGE_COLORS: Record<string, string> = {
  new: "var(--invicta-blue)", contacted: "var(--invicta-amber)",
  qualified: "var(--invicta-purple)", offer: "var(--invicta-green)",
  contract: "var(--invicta-green)", closed: "var(--invicta-red)",
};

type Lead = {
  id: string; stage: string; ask_price: number | null; arv: number | null;
  assigned_to: string | null; profiles?: any;
};

type UserStat = {
  id: string; name: string;
  byStage: Record<string, number>;
  total: number; activeValue: number; closedCount: number;
};

function fmt(n: number) { return "$" + n.toLocaleString(); }

export default function AnalyticsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    fetchData();
  }, []);

  async function fetchData() {
    const { data } = await supabase.from("leads").select("id, stage, ask_price, arv, assigned_to, profiles(display_name)");
    setLeads(data ?? []);
    setLoading(false);
  }

  const pool = leads.filter(l => !l.assigned_to);
  const assigned = leads.filter(l => l.assigned_to);

  // Build per-user stats
  const userMap = new Map<string, UserStat>();
  for (const lead of assigned) {
    if (!lead.assigned_to) continue;
    const name = (lead.profiles as any)?.display_name ?? "Unknown";
    if (!userMap.has(lead.assigned_to)) {
      userMap.set(lead.assigned_to, { id: lead.assigned_to, name, byStage: {}, total: 0, activeValue: 0, closedCount: 0 });
    }
    const stat = userMap.get(lead.assigned_to)!;
    stat.byStage[lead.stage] = (stat.byStage[lead.stage] ?? 0) + 1;
    stat.total++;
    if (lead.stage !== "closed" && lead.ask_price) stat.activeValue += lead.ask_price;
    if (lead.stage === "closed") stat.closedCount++;
  }
  const userStats = Array.from(userMap.values());
  const me = userStats.find(u => u.id === userId);
  const maxTotal = Math.max(...userStats.map(u => u.total), 1);

  const totalPipelineValue = leads.filter(l => l.ask_price && l.stage !== "closed").reduce((s, l) => s + (l.ask_price ?? 0), 0);
  const totalClosed = leads.filter(l => l.stage === "closed").length;
  const totalActive = leads.filter(l => l.assigned_to && l.stage !== "closed").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--invicta-green)" }} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1100px]">
      <div className="mb-8">
        <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "var(--muted-foreground)" }}>Performance</p>
        <h1 className="text-3xl font-bold tracking-wide">Analytics</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>Live data from your pipeline</p>
      </div>

      {/* team KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Pipeline Value",  value: totalPipelineValue > 0 ? fmt(totalPipelineValue) : "—", color: "var(--invicta-green)",  icon: DollarSign },
          { label: "Active Leads",    value: String(totalActive),                                     color: "var(--invicta-blue)",   icon: Target },
          { label: "In Pool",         value: String(pool.length),                                     color: "var(--invicta-amber)",  icon: Users },
          { label: "Deals Closed",    value: String(totalClosed),                                     color: "var(--invicta-purple)", icon: Zap },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="rounded-2xl border p-4 flex items-center gap-4"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}15` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* per-user breakdown */}
        {userStats.length === 0 ? (
          <div className="col-span-2 rounded-2xl border p-10 flex flex-col items-center justify-center"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <TrendingUp size={32} className="mb-3 opacity-30" />
            <p className="font-bold">No data yet</p>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
              Claim leads from the pool to start tracking metrics
            </p>
          </div>
        ) : userStats.map(user => (
          <div key={user.id} className="rounded-2xl border p-5"
            style={{
              background: "var(--surface)",
              borderColor: user.id === userId ? "var(--invicta-green)" : "var(--border)",
            }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
                  style={{ background: user.id === userId ? "var(--invicta-green)20" : "var(--invicta-blue)20",
                    color: user.id === userId ? "var(--invicta-green)" : "var(--invicta-blue)" }}>
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-sm">{user.name}</p>
                  {user.id === userId && (
                    <p className="text-xs" style={{ color: "var(--invicta-green)" }}>you</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold" style={{ color: "var(--invicta-green)" }}>
                  {user.activeValue > 0 ? fmt(user.activeValue) : "—"}
                </p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>active ask value</p>
              </div>
            </div>

            {/* stage breakdown bars */}
            <div className="flex flex-col gap-2 mb-4">
              {STAGE_ORDER.map(stage => {
                const count = user.byStage[stage] ?? 0;
                const pct = user.total > 0 ? (count / user.total) * 100 : 0;
                return (
                  <div key={stage} className="flex items-center gap-3">
                    <span className="text-xs w-24 flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>
                      {STAGE_LABELS[stage]}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--surface-3)" }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: STAGE_COLORS[stage] }} />
                    </div>
                    <span className="text-xs font-bold w-4 text-right flex-shrink-0"
                      style={{ color: count > 0 ? STAGE_COLORS[stage] : "var(--muted-foreground)" }}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
              {[
                { label: "Total Claimed",  value: user.total,        color: "var(--invicta-blue)" },
                { label: "Closed",         value: user.closedCount,  color: "var(--invicta-green)" },
                { label: "Conversion",     value: user.total > 0 ? `${Math.round((user.closedCount / user.total) * 100)}%` : "—", color: "var(--invicta-purple)" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex-1 text-center">
                  <p className="text-lg font-bold" style={{ color }}>{value}</p>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* pipeline funnel */}
      <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <h2 className="font-bold mb-1">Team Pipeline Funnel</h2>
        <p className="text-xs mb-5" style={{ color: "var(--muted-foreground)" }}>All leads across both users</p>
        <div className="flex flex-col gap-3">
          {STAGE_ORDER.map(stage => {
            const count = leads.filter(l => l.stage === stage).length;
            const pct = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;
            const value = leads.filter(l => l.stage === stage && l.ask_price).reduce((s, l) => s + (l.ask_price ?? 0), 0);
            return (
              <div key={stage} className="flex items-center gap-4">
                <div className="w-32 flex-shrink-0">
                  <p className="text-xs font-bold">{STAGE_LABELS[stage]}</p>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {count} lead{count !== 1 ? "s" : ""}{value > 0 ? ` · ${fmt(value)}` : ""}
                  </p>
                </div>
                <div className="flex-1 h-2 rounded-full" style={{ background: "var(--surface-3)" }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: STAGE_COLORS[stage] }} />
                </div>
                <span className="text-xs font-bold w-8 text-right flex-shrink-0" style={{ color: STAGE_COLORS[stage] }}>
                  {count > 0 ? `${pct}%` : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

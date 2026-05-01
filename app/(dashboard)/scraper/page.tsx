"use client";

import { useState, useRef } from "react";
import {
  Upload, Zap, ArrowUpRight, Check, X,
  MapPin, DollarSign, Loader2, ChevronDown,
  FileText, AlertCircle, Users,
} from "lucide-react";
import PageShell from "@/components/PageShell";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

type RawRow = Record<string, string>;
type ScoredLead = {
  id: number;
  score: number;
  priority: "high" | "medium" | "low";
  reason: string;
  raw: RawRow;
  added?: boolean;
};

const PRIORITY_CONFIG = {
  high:   { color: "var(--invicta-green)",  bg: "var(--invicta-green)18",  label: "High" },
  medium: { color: "var(--invicta-amber)",  bg: "var(--invicta-amber)18",  label: "Medium" },
  low:    { color: "var(--muted-foreground)", bg: "var(--surface-3)",       label: "Low" },
};

function parseCSV(text: string): { headers: string[]; rows: RawRow[] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map(line => {
    const vals = line.match(/(".*?"|[^,]+)(?=,|$)/g) ?? line.split(",");
    const cleaned = vals.map(v => v.trim().replace(/^"|"$/g, ""));
    return Object.fromEntries(headers.map((h, i) => [h, cleaned[i] ?? ""]));
  });
  return { headers, rows };
}

function detectCol(headers: string[], candidates: string[]): string {
  for (const c of candidates) {
    const found = headers.find(h => h.toLowerCase().includes(c.toLowerCase()));
    if (found) return found;
  }
  return "";
}

export default function ScraperPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<RawRow[]>([]);
  const [colMap, setColMap] = useState({ address: "", owner: "", price: "", notes: "", status: "" });
  const [scoring, setScoring] = useState(false);
  const [scored, setScored] = useState<ScoredLead[]>([]);
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [addingAll, setAddingAll] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"upload" | "map" | "results">("upload");

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const { headers: h, rows: r } = parseCSV(text);
      setHeaders(h);
      setRows(r);
      setColMap({
        address: detectCol(h, ["address", "street", "property"]),
        owner:   detectCol(h, ["owner", "name", "seller"]),
        price:   detectCol(h, ["price", "asking", "amount", "value"]),
        notes:   detectCol(h, ["notes", "description", "status", "comment", "details"]),
        status:  detectCol(h, ["foreclosure", "pre-foreclosure", "delinquent", "lien"]),
      });
      setStep("map");
      setScored([]);
      setError("");
    };
    reader.readAsText(file);
  }

  async function runScoring() {
    setScoring(true);
    setError("");
    try {
      const leads = rows.map((r, i) => ({
        id: i,
        address: r[colMap.address] ?? "",
        owner:   r[colMap.owner] ?? "",
        price:   r[colMap.price] ?? "",
        notes:   [r[colMap.notes], r[colMap.status]].filter(Boolean).join(" | "),
      }));

      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scoring failed");

      const scoredLeads: ScoredLead[] = data
        .map((s: any) => ({ ...s, raw: rows[s.id] }))
        .sort((a: ScoredLead, b: ScoredLead) => b.score - a.score);

      setScored(scoredLeads);
      setStep("results");
    } catch (e: any) {
      setError(e.message);
    }
    setScoring(false);
  }

  async function addToPool(lead: ScoredLead) {
    const address = lead.raw[colMap.address] ?? "";
    const price = lead.raw[colMap.price] ? Number(lead.raw[colMap.price].replace(/[^0-9.]/g, "")) : null;
    const owner = lead.raw[colMap.owner] ?? null;
    await supabase.from("leads").insert({
      address,
      owner_name: owner || null,
      ask_price: price || null,
      notes: lead.reason,
      source: "CSV Import",
      stage: "new",
      assigned_to: null,
    });
    setScored(prev => prev.map(l => l.id === lead.id ? { ...l, added: true } : l));
  }

  async function addAllHigh() {
    setAddingAll(true);
    const highLeads = scored.filter(l => l.priority === "high" && !l.added);
    for (const lead of highLeads) await addToPool(lead);
    setAddingAll(false);
  }

  const filtered = scored.filter(l => filter === "all" || l.priority === filter);
  const counts = {
    high:   scored.filter(l => l.priority === "high").length,
    medium: scored.filter(l => l.priority === "medium").length,
    low:    scored.filter(l => l.priority === "low").length,
  };
  const addedCount = scored.filter(l => l.added).length;

  return (
    <PageShell title="Lead Import" subtitle="Upload, score, and prioritize">

      {step === "upload" && (
        <div className="flex flex-col gap-4">
          <div
            onClick={() => fileRef.current?.click()}
            className="rounded-2xl border-2 border-dashed p-12 flex flex-col items-center justify-center cursor-pointer transition-all hover:opacity-70"
            style={{ borderColor: "var(--invicta-green)40", background: "var(--surface)" }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "var(--invicta-green)15" }}>
              <Upload size={24} style={{ color: "var(--invicta-green)" }} />
            </div>
            <p className="font-bold text-lg mb-1">Drop your lead list here</p>
            <p className="text-sm text-center" style={{ color: "var(--muted-foreground)" }}>
              CSV from any source — county records, PropStream, BatchLeads, Zillow export
            </p>
            <p className="text-xs mt-3 px-3 py-1.5 rounded-lg font-bold"
              style={{ background: "var(--invicta-green)20", color: "var(--invicta-green)" }}>
              Click to browse
            </p>
          </div>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={onFile} />

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: FileText, label: "Any CSV format", desc: "Auto-detects columns" },
              { icon: Zap,      label: "AI scoring",     desc: "Ranked by motivation" },
              { icon: Users,    label: "One-click import", desc: "Drops into lead pool" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="rounded-xl p-4 text-center" style={{ background: "var(--surface)" }}>
                <Icon size={18} className="mx-auto mb-2" style={{ color: "var(--invicta-green)" }} />
                <p className="text-xs font-bold">{label}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === "map" && (
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold">Map Your Columns</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                  {rows.length} rows detected — confirm which columns to use
                </p>
              </div>
              <button onClick={() => { setStep("upload"); setRows([]); setHeaders([]); }}
                className="text-xs px-3 py-1.5 rounded-lg font-bold"
                style={{ background: "var(--surface-3)", color: "var(--muted-foreground)" }}>
                Change file
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(colMap) as (keyof typeof colMap)[]).map(key => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold tracking-wider uppercase"
                    style={{ color: "var(--muted-foreground)" }}>
                    {key === "status" ? "Status / Foreclosure" : key.charAt(0).toUpperCase() + key.slice(1)}
                  </label>
                  <div className="relative">
                    <select
                      value={colMap[key]}
                      onChange={e => setColMap(m => ({ ...m, [key]: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none appearance-none"
                      style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "inherit" }}>
                      <option value="">— skip —</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: "var(--muted-foreground)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* preview */}
          <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--muted-foreground)" }}>
                Preview (first 3 rows)
              </p>
            </div>
            {rows.slice(0, 3).map((row, i) => (
              <div key={i} className="px-4 py-3 border-b last:border-0 text-sm" style={{ borderColor: "var(--border)" }}>
                <p className="font-bold truncate">{row[colMap.address] || "—"}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                  {[row[colMap.owner], row[colMap.price] && `$${row[colMap.price]}`, row[colMap.notes]].filter(Boolean).join(" · ")}
                </p>
              </div>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm p-3 rounded-xl"
              style={{ background: "var(--invicta-red)10", color: "var(--invicta-red)" }}>
              <AlertCircle size={14} />{error}
            </div>
          )}

          <button onClick={runScoring} disabled={scoring || !colMap.address}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all"
            style={{ background: colMap.address ? "var(--invicta-green)" : "var(--surface-3)", color: colMap.address ? "#000" : "var(--muted-foreground)" }}>
            {scoring
              ? <><Loader2 size={18} className="animate-spin" />AI is scoring {rows.length} leads...</>
              : <><Zap size={18} />Score {rows.length} leads with AI</>}
          </button>
        </div>
      )}

      {step === "results" && (
        <div className="flex flex-col gap-4">
          {/* summary bar */}
          <div className="rounded-2xl border p-4 flex items-center justify-between flex-wrap gap-3"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-4">
              {(["high", "medium", "low"] as const).map(p => (
                <div key={p} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: PRIORITY_CONFIG[p].color }} />
                  <span className="text-sm font-bold" style={{ color: PRIORITY_CONFIG[p].color }}>{counts[p]}</span>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{p}</span>
                </div>
              ))}
              {addedCount > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "var(--invicta-green)20", color: "var(--invicta-green)" }}>
                  {addedCount} added to pool
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setStep("upload"); setScored([]); setRows([]); }}
                className="text-xs px-3 py-1.5 rounded-lg font-bold"
                style={{ background: "var(--surface-3)", color: "var(--muted-foreground)" }}>
                New Import
              </button>
              {counts.high > 0 && (
                <button onClick={addAllHigh} disabled={addingAll}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold"
                  style={{ background: "var(--invicta-green)", color: "#000" }}>
                  {addingAll
                    ? <Loader2 size={12} className="animate-spin" />
                    : <ArrowUpRight size={12} />}
                  Add all High ({counts.high})
                </button>
              )}
            </div>
          </div>

          {/* filter tabs */}
          <div className="flex gap-2">
            {(["all", "high", "medium", "low"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize"
                style={{
                  background: filter === f ? `${f === "all" ? "var(--invicta-blue)" : PRIORITY_CONFIG[f as keyof typeof PRIORITY_CONFIG]?.color ?? "var(--invicta-blue)"}20` : "var(--surface)",
                  color: filter === f ? (f === "all" ? "var(--invicta-blue)" : PRIORITY_CONFIG[f as keyof typeof PRIORITY_CONFIG]?.color) : "var(--muted-foreground)",
                  border: `1px solid ${filter === f ? (f === "all" ? "var(--invicta-blue)" : PRIORITY_CONFIG[f as keyof typeof PRIORITY_CONFIG]?.color) : "var(--border)"}`,
                }}>
                {f === "all" ? `All (${scored.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${counts[f]})`}
              </button>
            ))}
          </div>

          {/* lead cards */}
          <div className="flex flex-col gap-2">
            {filtered.map(lead => {
              const cfg = PRIORITY_CONFIG[lead.priority];
              return (
                <div key={lead.id} className="rounded-2xl border p-4 flex items-start gap-4"
                  style={{ background: "var(--surface)", borderColor: "var(--border)", opacity: lead.added ? 0.6 : 1 }}>
                  {/* score badge */}
                  <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-lg"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    {lead.score}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <MapPin size={12} style={{ color: cfg.color }} />
                      <p className="font-bold text-sm truncate">{lead.raw[colMap.address] || "Unknown address"}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>
                    {lead.raw[colMap.owner] && (
                      <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                        {lead.raw[colMap.owner]}
                      </p>
                    )}
                    <p className="text-xs italic" style={{ color: "var(--muted-foreground)" }}>
                      {lead.reason}
                    </p>
                    {lead.raw[colMap.price] && (
                      <p className="text-xs mt-1 font-bold" style={{ color: "var(--invicta-amber)" }}>
                        <DollarSign size={10} className="inline" />{lead.raw[colMap.price]}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => !lead.added && addToPool(lead)}
                    disabled={lead.added}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: lead.added ? "var(--invicta-green)20" : "var(--invicta-green)",
                      color: lead.added ? "var(--invicta-green)" : "#000",
                    }}>
                    {lead.added ? <><Check size={12} />Added</> : <><ArrowUpRight size={12} />Add to Pool</>}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </PageShell>
  );
}

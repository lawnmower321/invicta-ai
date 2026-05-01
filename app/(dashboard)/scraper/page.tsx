"use client";

import { useState } from "react";
import {
  Radio, Play, Pause, RefreshCw, MapPin, DollarSign,
  Filter, ArrowUpRight, Check,
} from "lucide-react";
import PageShell from "@/components/PageShell";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

type Lead = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  source: string;
  status: "new" | "contacted" | "skipped";
  listPrice: number | null;
  bedsName: string;
  daysListed: number;
  notes: string;
};

const MOCK_LEADS: Lead[] = [
  { id: "s1", address: "14 Fernwood Rd",      city: "Yonkers",       state: "NY", zip: "10701", source: "FSBO / Zillow", status: "new",       listPrice: 185000, bedsName: "3bd/1ba", daysListed: 2,  notes: "Owner selling FSBO, mentioned divorce." },
  { id: "s2", address: "337 Palisade Ave",    city: "Yonkers",       state: "NY", zip: "10703", source: "HUD Homes",    status: "new",       listPrice: 142000, bedsName: "2bd/1ba", daysListed: 8,  notes: "HUD foreclosure, AS-IS listing." },
  { id: "s3", address: "88 Rockwood Dr",      city: "Mount Vernon",  state: "NY", zip: "10550", source: "FSBO / Zillow", status: "contacted",  listPrice: 210000, bedsName: "4bd/2ba", daysListed: 14, notes: "Called — owner open but needs 30 days." },
  { id: "s4", address: "45 Willow St",        city: "New Rochelle",  state: "NY", zip: "10801", source: "Fannie Mae",   status: "new",       listPrice: 168000, bedsName: "3bd/2ba", daysListed: 5,  notes: "HomePath listing, light rehab needed." },
  { id: "s5", address: "201 Park Ave",        city: "Tarrytown",     state: "NY", zip: "10591", source: "FSBO / Zillow", status: "new",       listPrice: null,   bedsName: "3bd/1ba", daysListed: 1,  notes: "No price listed — reach out ASAP." },
  { id: "s6", address: "17 Summit Ter",       city: "Ossining",      state: "NY", zip: "10562", source: "HUD Homes",    status: "skipped",    listPrice: 97000,  bedsName: "2bd/1ba", daysListed: 22, notes: "Too much damage per listing description." },
  { id: "s7", address: "520 Main St Unit 2A", city: "Peekskill",     state: "NY", zip: "10566", source: "Fannie Mae",   status: "new",       listPrice: 135000, bedsName: "2bd/1ba", daysListed: 3,  notes: "Condo, HomePath eligible." },
  { id: "s8", address: "73 Lafayette Ave",    city: "White Plains",  state: "NY", zip: "10603", source: "FSBO / Zillow", status: "new",       listPrice: 299000, bedsName: "5bd/3ba", daysListed: 6,  notes: "Priced high but FSBO — room to negotiate." },
];

const SOURCE_COLOR: Record<string, string> = {
  "FSBO / Zillow": "var(--invicta-purple)",
  "HUD Homes":     "var(--invicta-blue)",
  "Fannie Mae":    "var(--invicta-amber)",
};

const STATUS_CONFIG = {
  new:       { label: "New",       color: "var(--invicta-green)", bg: "var(--invicta-green)18" },
  contacted: { label: "Contacted", color: "var(--invicta-amber)", bg: "var(--invicta-amber)18" },
  skipped:   { label: "Skipped",   color: "var(--muted-foreground)", bg: "var(--surface-3)" },
};

export default function ScraperPage() {
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [running, setRunning] = useState(false);
  const [source, setSource] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lastRun, setLastRun] = useState("Today at 9:14 AM");
  const [added, setAdded] = useState<Set<string>>(new Set());

  function toggleRun() {
    if (running) {
      setRunning(false);
      return;
    }
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      setLastRun("Just now");
      const fresh: Lead = {
        id: Date.now().toString(),
        address: "62 Chester Ave",
        city: "Port Chester",
        state: "NY",
        zip: "10573",
        source: "FSBO / Zillow",
        status: "new",
        listPrice: 198000,
        bedsName: "3bd/2ba",
        daysListed: 0,
        notes: "Brand new FSBO listing.",
      };
      setLeads(prev => [fresh, ...prev]);
    }, 2800);
  }

  function markStatus(id: string, status: Lead["status"]) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  }

  async function sendToPipeline(lead: Lead) {
    const fullAddress = `${lead.address}, ${lead.city} ${lead.state} ${lead.zip}`;
    const { error } = await supabase.from("leads").insert({
      address: fullAddress,
      source: lead.source,
      ask_price: lead.listPrice,
      notes: lead.notes,
      stage: "new",
      assigned_to: null,
    });
    if (!error) {
      setAdded(prev => new Set(prev).add(lead.id));
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: "contacted" } : l));
    }
  }

  const sources = ["all", ...Array.from(new Set(MOCK_LEADS.map(l => l.source)))];

  const filtered = leads.filter(l => {
    if (source !== "all" && l.source !== source) return false;
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    return true;
  });

  const newCount = leads.filter(l => l.status === "new").length;

  return (
    <PageShell
      title="Scraper"
      subtitle="Find motivated sellers"
      action={
        <button onClick={toggleRun}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90"
          style={{ background: running ? "var(--invicta-red)" : "var(--invicta-green)", color: "#000" }}>
          {running ? <><Pause size={15} />Stop Scraper</> : <><Play size={15} />Run Scraper</>}
        </button>
      }
    >
      <div>
      {/* status bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "New Leads",    value: newCount,                                  color: "var(--invicta-green)" },
          { label: "Contacted",    value: leads.filter(l => l.status === "contacted").length, color: "var(--invicta-amber)" },
          { label: "Skipped",      value: leads.filter(l => l.status === "skipped").length,  color: "var(--muted-foreground)" },
          { label: "Total Found",  value: leads.length,                               color: "var(--invicta-blue)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>{label}</p>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* sources legend */}
      <div className="rounded-2xl border p-4 mb-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-5 flex-wrap">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--muted-foreground)" }}>
              Sources
            </span>
            {Object.entries(SOURCE_COLOR).map(([src, color]) => (
              <div key={src} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-xs font-bold">{src}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
            <RefreshCw size={11} className={running ? "animate-spin" : ""} />
            Last run: {lastRun}
            {running && <span className="animate-pulse" style={{ color: "var(--invicta-green)" }}>• scanning</span>}
          </div>
        </div>
      </div>

      {/* filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter size={13} style={{ color: "var(--muted-foreground)" }} />
          <span className="text-xs font-bold" style={{ color: "var(--muted-foreground)" }}>Source:</span>
          {sources.map(s => (
            <button key={s} onClick={() => setSource(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize"
              style={{
                background: source === s ? "var(--invicta-blue)20" : "var(--surface)",
                color: source === s ? "var(--invicta-blue)" : "var(--muted-foreground)",
                border: source === s ? "1px solid var(--invicta-blue)" : "1px solid var(--border)",
              }}>
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold" style={{ color: "var(--muted-foreground)" }}>Status:</span>
          {["all", "new", "contacted", "skipped"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize"
              style={{
                background: statusFilter === s ? "var(--invicta-green)20" : "var(--surface)",
                color: statusFilter === s ? "var(--invicta-green)" : "var(--muted-foreground)",
                border: statusFilter === s ? "1px solid var(--invicta-green)" : "1px solid var(--border)",
              }}>
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      {/* leads list */}
      <div className="flex flex-col gap-2.5">
        {running && (
          <div className="rounded-2xl border border-dashed p-4 flex items-center gap-3 animate-pulse"
            style={{ borderColor: "var(--invicta-green)", background: "var(--invicta-green)08" }}>
            <Radio size={16} style={{ color: "var(--invicta-green)" }} />
            <span className="text-sm font-bold" style={{ color: "var(--invicta-green)" }}>
              Scanning HUD, Zillow FSBO, Fannie Mae HomePath...
            </span>
          </div>
        )}
        {filtered.map(lead => {
          const srcColor = SOURCE_COLOR[lead.source] ?? "var(--invicta-blue)";
          const stCfg = STATUS_CONFIG[lead.status];
          return (
            <div key={lead.id} className="rounded-2xl border p-4 flex items-start gap-4 transition-all"
              style={{
                background: "var(--surface)",
                borderColor: lead.status === "new" ? "var(--border)" : "var(--border)",
                borderLeftWidth: 3,
                borderLeftColor: srcColor,
              }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <MapPin size={13} style={{ color: srcColor }} />
                  <p className="font-bold text-sm">{lead.address}, {lead.city} {lead.state} {lead.zip}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{ background: `${srcColor}20`, color: srcColor }}>
                    {lead.source}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{ background: stCfg.bg, color: stCfg.color }}>
                    {stCfg.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
                  <span>{lead.bedsName}</span>
                  {lead.listPrice && <span className="flex items-center gap-1"><DollarSign size={10} />{lead.listPrice.toLocaleString()}</span>}
                  <span>{lead.daysListed === 0 ? "Listed today" : `${lead.daysListed}d on market`}</span>
                </div>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{lead.notes}</p>
              </div>
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <button
                  onClick={() => !added.has(lead.id) && sendToPipeline(lead)}
                  disabled={added.has(lead.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: added.has(lead.id) ? "var(--invicta-green)30" : "var(--invicta-green)20",
                    color: "var(--invicta-green)",
                    opacity: added.has(lead.id) ? 1 : undefined,
                  }}>
                  {added.has(lead.id) ? <Check size={11} /> : <ArrowUpRight size={11} />}
                  {added.has(lead.id) ? "Added" : "Pipeline"}
                </button>
                {lead.status !== "skipped" && (
                  <button onClick={() => markStatus(lead.id, "skipped")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-opacity hover:opacity-80"
                    style={{ background: "var(--surface-3)", color: "var(--muted-foreground)" }}>
                    Skip
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </PageShell>
  );
}

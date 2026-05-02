"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Phone, MapPin, User, DollarSign, FileText,
  Zap, Loader2, ChevronDown, Check, Copy,
  ArrowRight, Clock, CheckCircle2, XCircle,
  PhoneMissed, PhoneOff, Calendar, Plus,
} from "lucide-react";
import PageShell from "@/components/PageShell";

const supabase = createClient();

type Lead = {
  id: string;
  address: string;
  owner_name: string | null;
  phone: string | null;
  ask_price: number | null;
  arv: number | null;
  repair_est: number | null;
  stage: string;
  source: string;
  notes: string | null;
  assigned_to: string | null;
};

const CONDITION_LEVELS = [
  { id: "light",    label: "Light",    range: [15, 25],  desc: "Paint, floors" },
  { id: "moderate", label: "Moderate", range: [25, 40],  desc: "Kitchen + bath" },
  { id: "major",    label: "Major",    range: [40, 60],  desc: "Full interior" },
  { id: "gut",      label: "Gut",      range: [60, 80],  desc: "Everything" },
];

const OUTCOMES = [
  { id: "interested",  label: "Interested",      icon: CheckCircle2, color: "var(--invicta-green)",  stage: "qualified" },
  { id: "voicemail",   label: "Left Voicemail",  icon: PhoneMissed,  color: "var(--invicta-amber)",  stage: "contacted" },
  { id: "callback",    label: "Call Back Later", icon: Clock,        color: "var(--invicta-blue)",   stage: "contacted" },
  { id: "notinterested",label: "Not Interested", icon: XCircle,     color: "var(--muted-foreground)",stage: "contacted" },
  { id: "wrongnumber", label: "Wrong Number",    icon: PhoneOff,     color: "var(--invicta-red)",    stage: "contacted" },
];

function fmt(n: number) { return "$" + Math.round(n).toLocaleString(); }
function parseDollar(s: string) { const n = Number(s.replace(/[^0-9.]/g, "")); return isNaN(n) ? 0 : n; }

export default function CallPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [leadGroup, setLeadGroup] = useState<"pool" | "mine">("pool");

  // Calculator
  const [sqft, setSqft] = useState("");
  const [condLevel, setCondLevel] = useState("");
  const [arv, setArv] = useState("");
  const [repair, setRepair] = useState("");
  const [askPrice, setAskPrice] = useState("");
  const maoFactor = 70;
  const arvN = parseDollar(arv);
  const repairN = parseDollar(repair);
  const askN = parseDollar(askPrice);
  const mao = arvN * (maoFactor / 100) - repairN - (arvN * 0.03);
  const spread = mao - askN;
  const dealGood = askN > 0 && mao > askN;

  // AI Quick Offer
  const [condition, setCondition] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [showAi, setShowAi] = useState(false);

  // Call logging
  const [outcome, setOutcome] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const [logging, setLogging] = useState(false);
  const [logged, setLogged] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    fetchLeads();
  }, []);

  useEffect(() => { fetchLeads(); }, [leadGroup]);

  async function fetchLeads() {
    setLoading(true);
    let query = supabase.from("leads").select("*").order("created_at", { ascending: false });
    if (leadGroup === "pool") {
      query = query.is("assigned_to", null);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) query = query.eq("assigned_to", user.id).in("stage", ["new", "contacted", "qualified"]);
    }
    const { data } = await query;
    setLeads(data ?? []);
    setLoading(false);
  }

  function selectLead(id: string) {
    setSelectedId(id);
    const l = leads.find(x => x.id === id) ?? null;
    setLead(l);
    setAiResult(null);
    setLogged(false);
    setOutcome("");
    setCallNotes("");
    setFollowUpDate("");
    if (l) {
      setArv(l.arv ? String(l.arv) : "");
      setRepair(l.repair_est ? String(l.repair_est) : "");
      setAskPrice(l.ask_price ? String(l.ask_price) : "");
    }
  }

  function applyCondition(id: string) {
    setCondLevel(id);
    const level = CONDITION_LEVELS.find(c => c.id === id);
    if (!level || !sqft) return;
    const sqftN = Number(sqft.replace(/\D/g, ""));
    if (!sqftN) return;
    const mid = Math.round((level.range[0] + level.range[1]) / 2);
    setRepair(String(sqftN * mid));
  }

  async function runAI() {
    setAiLoading(true);
    setAiResult(null);
    const res = await fetch("/api/quick-offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: lead?.address ?? "the subject property",
        sqft: sqft || null,
        condition: condition || condLevel,
        sellerPrice: askN || lead?.ask_price || null,
        maoFactor,
      }),
    });
    const data = await res.json();
    setAiResult(data);
    if (data.arv && !arvN) setArv(String(data.arv));
    if (data.repairLow && !repairN) setRepair(String(Math.round((data.repairLow + data.repairHigh) / 2)));
    setAiLoading(false);
  }

  function copyScript() {
    if (!aiResult?.sellerScript) return;
    navigator.clipboard.writeText(aiResult.sellerScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function logCall() {
    if (!lead || !outcome || !userId) return;
    setLogging(true);
    const outcomeConfig = OUTCOMES.find(o => o.id === outcome);

    await supabase.from("lead_activity").insert({
      lead_id: lead.id,
      user_id: userId,
      action: "call_logged",
      details: `${outcomeConfig?.label}${callNotes ? ": " + callNotes : ""}`,
    });

    if (outcomeConfig?.stage && outcomeConfig.stage !== lead.stage) {
      await supabase.from("leads").update({ stage: outcomeConfig.stage }).eq("id", lead.id);
    }

    if (followUpDate && callNotes) {
      await supabase.from("followups").insert({
        text: callNotes || `Follow up — ${lead.address}`,
        lead_label: lead.address,
        lead_id: lead.id,
        due_date: followUpDate,
        priority: outcome === "interested" ? "high" : "medium",
        done: false,
        user_id: userId,
      });
    }

    setLogged(true);
    setLogging(false);
  }

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const in3 = new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0];

  return (
    <PageShell title="Call Center" subtitle="Live deal cockpit">

      {/* Lead Selector */}
      <div className="rounded-2xl border p-4 mb-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex gap-2 mb-3">
          {([["pool", "Lead Pool"], ["mine", "My Pipeline"]] as const).map(([g, label]) => (
            <button key={g} onClick={() => setLeadGroup(g)}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                background: leadGroup === g ? "var(--invicta-green)20" : "var(--surface-3)",
                color: leadGroup === g ? "var(--invicta-green)" : "var(--muted-foreground)",
                border: leadGroup === g ? "1px solid var(--invicta-green)" : "1px solid var(--border)",
              }}>
              {label}
            </button>
          ))}
        </div>
        <div className="relative">
          <select value={selectedId} onChange={e => selectLead(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border text-sm outline-none appearance-none font-bold"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: selectedId ? "var(--foreground)" : "var(--muted-foreground)", fontFamily: "inherit" }}>
            <option value="">{loading ? "Loading leads..." : `Select a lead to call (${leads.length} available)`}</option>
            {leads.map(l => (
              <option key={l.id} value={l.id}>
                {l.address}{l.owner_name ? ` — ${l.owner_name}` : ""}{l.ask_price ? ` — $${l.ask_price.toLocaleString()}` : ""}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--muted-foreground)" }} />
        </div>
      </div>

      {!lead && (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed"
          style={{ borderColor: "var(--border)" }}>
          <Phone size={32} className="mb-3 opacity-30" />
          <p className="font-bold mb-1">Select a lead to start your call</p>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Everything you need will load automatically
          </p>
        </div>
      )}

      {lead && (
        <div className="flex flex-col gap-4">

          {/* Lead Info Card */}
          <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--invicta-green)40" }}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin size={14} style={{ color: "var(--invicta-green)" }} />
                  <p className="font-bold">{lead.address}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{ background: "var(--invicta-green)15", color: "var(--invicta-green)" }}>
                    {lead.source}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{ background: "var(--surface-3)", color: "var(--muted-foreground)" }}>
                    {lead.stage}
                  </span>
                </div>
              </div>
              {lead.phone && (
                <a href={`tel:${lead.phone}`}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm flex-shrink-0"
                  style={{ background: "var(--invicta-green)", color: "#000" }}>
                  <Phone size={15} /> Call
                </a>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {lead.owner_name && (
                <div className="rounded-xl p-3" style={{ background: "var(--surface-2)" }}>
                  <p className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>Owner</p>
                  <p className="text-sm font-bold">{lead.owner_name}</p>
                </div>
              )}
              {lead.phone && (
                <div className="rounded-xl p-3" style={{ background: "var(--surface-2)" }}>
                  <p className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>Phone</p>
                  <a href={`tel:${lead.phone}`} className="text-sm font-bold" style={{ color: "var(--invicta-green)" }}>
                    {lead.phone}
                  </a>
                </div>
              )}
              {lead.ask_price && (
                <div className="rounded-xl p-3" style={{ background: "var(--surface-2)" }}>
                  <p className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>Asking</p>
                  <p className="text-sm font-bold" style={{ color: "var(--invicta-amber)" }}>${lead.ask_price.toLocaleString()}</p>
                </div>
              )}
              {lead.arv && (
                <div className="rounded-xl p-3" style={{ background: "var(--surface-2)" }}>
                  <p className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>Known ARV</p>
                  <p className="text-sm font-bold" style={{ color: "var(--invicta-blue)" }}>${lead.arv.toLocaleString()}</p>
                </div>
              )}
            </div>

            {lead.notes && (
              <div className="mt-3 rounded-xl p-3" style={{ background: "var(--invicta-amber)10", border: "1px solid var(--invicta-amber)25" }}>
                <p className="text-xs font-bold mb-1" style={{ color: "var(--invicta-amber)" }}>Notes from Import</p>
                <p className="text-xs leading-relaxed">{lead.notes}</p>
              </div>
            )}
          </div>

          {/* Live MAO Calculator */}
          <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--muted-foreground)" }}>
              Live MAO Calculator
            </p>

            <div className="flex flex-col gap-3 mb-4">
              {/* ARV + Ask row */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs font-bold mb-1" style={{ color: "var(--muted-foreground)" }}>ARV</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: "var(--invicta-blue)" }}>$</span>
                    <input type="text" value={arv} onChange={e => setArv(e.target.value)}
                      placeholder="290,000"
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl border text-sm font-bold outline-none"
                      style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "inherit" }}
                      onFocus={e => (e.target.style.borderColor = "var(--invicta-blue)")}
                      onBlur={e => (e.target.style.borderColor = "var(--border)")}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold mb-1" style={{ color: "var(--muted-foreground)" }}>They're Asking</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: "var(--invicta-amber)" }}>$</span>
                    <input type="text" value={askPrice} onChange={e => setAskPrice(e.target.value)}
                      placeholder="165,000"
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl border text-sm font-bold outline-none"
                      style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "inherit" }}
                      onFocus={e => (e.target.style.borderColor = "var(--invicta-amber)")}
                      onBlur={e => (e.target.style.borderColor = "var(--border)")}
                    />
                  </div>
                </div>
              </div>

              {/* Sqft + condition */}
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: "var(--muted-foreground)" }}>Sq Ft + Condition → Auto Repair</p>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={sqft} onChange={e => { setSqft(e.target.value); if (condLevel) applyCondition(condLevel); }}
                    placeholder="sqft"
                    className="w-24 px-3 py-2.5 rounded-xl border text-sm font-bold outline-none text-center"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "inherit" }}
                    onFocus={e => (e.target.style.borderColor = "var(--invicta-red)")}
                    onBlur={e => (e.target.style.borderColor = "var(--border)")}
                  />
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: "var(--invicta-red)" }}>$</span>
                    <input type="text" value={repair} onChange={e => setRepair(e.target.value)}
                      placeholder="Repair est."
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl border text-sm font-bold outline-none"
                      style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "inherit" }}
                      onFocus={e => (e.target.style.borderColor = "var(--invicta-red)")}
                      onBlur={e => (e.target.style.borderColor = "var(--border)")}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {CONDITION_LEVELS.map(c => (
                    <button key={c.id} onClick={() => applyCondition(c.id)}
                      className="py-2 rounded-xl text-center transition-all"
                      style={{
                        background: condLevel === c.id ? "var(--invicta-red)20" : "var(--surface-3)",
                        border: condLevel === c.id ? "1px solid var(--invicta-red)" : "1px solid var(--border)",
                      }}>
                      <p className="text-xs font-bold" style={{ color: condLevel === c.id ? "var(--invicta-red)" : "var(--foreground)" }}>{c.label}</p>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)", fontSize: "10px" }}>{c.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* MAO Result */}
            <div className="rounded-2xl p-4 text-center"
              style={{ background: mao > 0 ? "var(--invicta-green)12" : "var(--surface-2)", border: `1px solid ${mao > 0 ? "var(--invicta-green)" : "var(--border)"}` }}>
              <p className="text-xs font-bold mb-1" style={{ color: "var(--muted-foreground)" }}>MAX OFFER (MAO)</p>
              <p className="text-4xl font-bold" style={{ color: "var(--invicta-green)" }}>
                {mao > 0 ? fmt(mao) : "—"}
              </p>
              {askN > 0 && mao > 0 && (
                <div className="mt-2 flex items-center justify-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      background: dealGood ? "var(--invicta-green)20" : "var(--invicta-red)20",
                      color: dealGood ? "var(--invicta-green)" : "var(--invicta-red)",
                    }}>
                    {dealGood ? "✓ Deal works" : "✗ Upside down"}
                    {dealGood && ` — ${fmt(spread)} spread`}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Quick Offer */}
          <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--invicta-purple)40" }}>
            <button onClick={() => setShowAi(v => !v)}
              className="w-full px-5 py-4 flex items-center justify-between"
              style={{ background: "var(--invicta-purple)10" }}>
              <div className="flex items-center gap-2">
                <Zap size={15} style={{ color: "var(--invicta-purple)" }} />
                <span className="font-bold text-sm" style={{ color: "var(--invicta-purple)" }}>AI Quick Offer + Script</span>
              </div>
              <ChevronDown size={14} style={{ transform: showAi ? "rotate(180deg)" : "none", transition: "0.15s" }} />
            </button>
            {showAi && (
              <div className="p-4 flex flex-col gap-3">
                <textarea value={condition} onChange={e => setCondition(e.target.value)}
                  placeholder="Describe what seller says about the property — 'needs new roof, kitchen is original 1970s, has a crack in the foundation'"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "inherit" }}
                  onFocus={e => (e.target.style.borderColor = "var(--invicta-purple)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
                <button onClick={runAI} disabled={aiLoading}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
                  style={{ background: "var(--invicta-purple)", color: "#fff" }}>
                  {aiLoading ? <><Loader2 size={14} className="animate-spin" />Analyzing...</> : <><Zap size={14} />Get Offer + Script</>}
                </button>
                {aiResult && (
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "AI ARV",    value: aiResult.arv ? fmt(aiResult.arv) : "—",   color: "var(--invicta-blue)" },
                        { label: "Repairs",   value: aiResult.repairLow ? `${fmt(aiResult.repairLow)}–${fmt(aiResult.repairHigh)}` : "—", color: "var(--invicta-red)" },
                        { label: "MAO",       value: aiResult.mao ? fmt(aiResult.mao) : "—",   color: "var(--invicta-green)" },
                        { label: "Max Fee",   value: aiResult.maxFee ? fmt(aiResult.maxFee) : "—", color: "var(--invicta-amber)" },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="rounded-xl p-3" style={{ background: "var(--surface-2)" }}>
                          <p className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>{label}</p>
                          <p className="font-bold" style={{ color }}>{value}</p>
                        </div>
                      ))}
                    </div>
                    {aiResult.sellerScript && (
                      <div className="rounded-xl p-4" style={{ background: "var(--invicta-green)10", border: "1px solid var(--invicta-green)30" }}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold" style={{ color: "var(--invicta-green)" }}>Read this to the seller</p>
                          <button onClick={copyScript}
                            className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg"
                            style={{ background: "var(--invicta-green)20", color: "var(--invicta-green)" }}>
                            {copied ? <><Check size={11} />Copied</> : <><Copy size={11} />Copy</>}
                          </button>
                        </div>
                        <p className="text-sm leading-relaxed italic">"{aiResult.sellerScript}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Call Logger */}
          <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--muted-foreground)" }}>
              Log This Call
            </p>

            {/* outcome buttons */}
            <div className="flex flex-col gap-2 mb-4">
              {OUTCOMES.map(o => {
                const Icon = o.icon;
                return (
                  <button key={o.id} onClick={() => setOutcome(o.id)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all text-left"
                    style={{
                      background: outcome === o.id ? `${o.color}20` : "var(--surface-2)",
                      border: outcome === o.id ? `1px solid ${o.color}` : "1px solid var(--border)",
                      color: outcome === o.id ? o.color : "var(--muted-foreground)",
                    }}>
                    <Icon size={16} style={{ color: o.color, flexShrink: 0 }} />
                    {o.label}
                  </button>
                );
              })}
            </div>

            {/* notes */}
            <textarea value={callNotes} onChange={e => setCallNotes(e.target.value)}
              placeholder="What happened? What did they say? Any key details..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none mb-3"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "inherit" }}
              onFocus={e => (e.target.style.borderColor = "var(--invicta-green)")}
              onBlur={e => (e.target.style.borderColor = "var(--border)")}
            />

            {/* follow-up date quick picks */}
            {(outcome === "voicemail" || outcome === "callback" || outcome === "interested") && (
              <div className="mb-3">
                <p className="text-xs font-bold mb-2" style={{ color: "var(--muted-foreground)" }}>Schedule Follow-up</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: "Today",    value: today },
                    { label: "Tomorrow", value: tomorrow },
                    { label: "In 3 Days",value: in3 },
                  ].map(({ label, value }) => (
                    <button key={label} onClick={() => setFollowUpDate(value)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: followUpDate === value ? "var(--invicta-amber)20" : "var(--surface-3)",
                        color: followUpDate === value ? "var(--invicta-amber)" : "var(--muted-foreground)",
                        border: followUpDate === value ? "1px solid var(--invicta-amber)" : "1px solid var(--border)",
                      }}>
                      {label}
                    </button>
                  ))}
                  <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)}
                    className="px-3 py-1.5 rounded-lg text-xs outline-none border"
                    style={{ background: "var(--surface-3)", borderColor: "var(--border)", color: "var(--foreground)", colorScheme: "dark" }}
                  />
                </div>
              </div>
            )}

            {logged ? (
              <div className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
                style={{ background: "var(--invicta-green)20", color: "var(--invicta-green)" }}>
                <CheckCircle2 size={16} /> Call logged — ready for next lead
              </div>
            ) : (
              <button onClick={logCall} disabled={logging || !outcome}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
                style={{
                  background: outcome ? "var(--invicta-green)" : "var(--surface-3)",
                  color: outcome ? "#000" : "var(--muted-foreground)",
                }}>
                {logging ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                {logging ? "Logging..." : "Log Call + Next Lead"}
              </button>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}

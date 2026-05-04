"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Calculator, TrendingUp, Save, Check, Zap, Loader2, Copy, ChevronDown, ChevronUp } from "lucide-react";
import PageShell from "@/components/PageShell";
import { createClient } from "@/utils/supabase/client";
import { fmt, parseDollar } from "@/utils/format";
import { CONDITION_LEVELS } from "@/utils/conditions";

const supabase = createClient();

function InputRow({
  label, value, onChange, placeholder, color, hint,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; color: string; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold tracking-wider uppercase"
          style={{ color: "var(--muted-foreground)" }}>
          {label}
        </label>
        {hint && <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{hint}</span>}
      </div>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold"
          style={{ color }}>$</span>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? "0"}
          className="w-full pl-7 pr-4 py-3 rounded-xl border text-sm font-bold outline-none transition-all"
          style={{
            background: "var(--surface-2)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
            fontFamily: "inherit",
          }}
          onFocus={e => (e.target.style.borderColor = color)}
          onBlur={e => (e.target.style.borderColor = "var(--border)")}
        />
      </div>
    </div>
  );
}

function SliderRow({
  label, value, onChange, min, max, step, suffix, color,
}: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; suffix: string; color: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold tracking-wider uppercase"
          style={{ color: "var(--muted-foreground)" }}>
          {label}
        </label>
        <span className="text-sm font-bold" style={{ color }}>
          {value}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: color }}
      />
      <div className="flex justify-between text-xs" style={{ color: "var(--muted-foreground)" }}>
        <span>{min}{suffix}</span><span>{max}{suffix}</span>
      </div>
    </div>
  );
}

function CalculatorContent() {
  const params = useSearchParams();
  const leadId = params.get("leadId");

  const [arv, setArv] = useState(params.get("arv") ?? "");
  const [repair, setRepair] = useState(params.get("repair") ?? "");
  const [askPrice, setAskPrice] = useState(params.get("ask") ?? "");
  const [assignFee, setAssignFee] = useState("10000");
  const [closingPct, setClosingPct] = useState(3);
  const [holdMonths, setHoldMonths] = useState(3);
  const [maoFactor, setMaoFactor] = useState(70);
  const [financing, setFinancing] = useState("cash");
  const [saved, setSaved] = useState(false);
  const [sqft, setSqft] = useState(params.get("sqft") ?? "");
  const [conditionLevel, setConditionLevel] = useState<string>("");


  function applyCondition(id: string) {
    setConditionLevel(id);
    const level = CONDITION_LEVELS.find(c => c.id === id);
    if (!level || !sqft) return;
    const sqftN = Number(sqft.replace(/\D/g, ""));
    if (!sqftN) return;
    const midpoint = Math.round((level.range[0] + level.range[1]) / 2);
    setRepair(String(sqftN * midpoint));
  }

  // Quick Offer AI
  const [condition, setCondition] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [showAi, setShowAi] = useState(false);
  const [copied, setCopied] = useState(false);

  const arvN = parseDollar(arv);
  const repairN = parseDollar(repair);
  const askN = parseDollar(askPrice);
  const assignN = parseDollar(assignFee);

  const closingCosts = arvN * (closingPct / 100);
  const holdingCosts = financing === "hard_money" ? arvN * 0.12 * (holdMonths / 12) : 0;
  const mao = arvN * (maoFactor / 100) - repairN - closingCosts - holdingCosts;
  const maxAssign = mao - askN;
  const profit = askN > 0 ? mao - askN - assignN : null;
  const roi = askN > 0 && arvN > 0 ? ((mao - askN) / askN) * 100 : null;

  const good = askN > 0 && mao > askN;

  async function runQuickOffer() {
    if (!arv && !askPrice) return;
    setAiLoading(true);
    setAiResult(null);
    const res = await fetch("/api/quick-offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: params.get("address") ?? "the subject property",
        sqft: null,
        condition,
        sellerPrice: askN || null,
        maoFactor,
      }),
    });
    const data = await res.json();
    setAiResult(data);
    if (data.arv) setArv(String(data.arv));
    if (data.repairLow) setRepair(String(Math.round((data.repairLow + data.repairHigh) / 2)));
    setAiLoading(false);
  }

  function copyScript() {
    if (aiResult?.sellerScript) {
      navigator.clipboard.writeText(aiResult.sellerScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function saveToLead() {
    if (!leadId) return;
    await supabase.from("leads").update({
      arv: arvN || null,
      repair_est: repairN || null,
      ask_price: askN || null,
    }).eq("id", leadId);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <PageShell title="Calculator" subtitle="MAO & assignment fee"
      back={!!leadId}
      action={leadId ? (
        <button onClick={saveToLead}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all"
          style={{ background: saved ? "var(--invicta-green)20" : "var(--invicta-green)", color: saved ? "var(--invicta-green)" : "#000" }}>
          {saved ? <><Check size={14} />Saved</> : <><Save size={14} />Save to Lead</>}
        </button>
      ) : undefined}
    >
      <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* inputs */}
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h2 className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--muted-foreground)" }}>
              Property Numbers
            </h2>
            <div className="flex flex-col gap-4">
              <InputRow label="After Repair Value (ARV)" value={arv} onChange={setArv}
                placeholder="290,000" color="var(--invicta-blue)" />
              <InputRow label="Owner Ask Price" value={askPrice} onChange={setAskPrice}
                placeholder="165,000" color="var(--invicta-amber)" />
              <InputRow label="Your Assignment Fee" value={assignFee} onChange={setAssignFee}
                placeholder="10,000" color="var(--invicta-green)" />

              {/* repair estimator */}
              <div className="flex flex-col gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                <p className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--muted-foreground)" }}>
                  Repair Estimate
                </p>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold"
                      style={{ color: "var(--muted-foreground)" }}>sqft</span>
                    <input type="text" value={sqft}
                      onChange={e => { setSqft(e.target.value); if (conditionLevel) applyCondition(conditionLevel); }}
                      placeholder="1,400"
                      className="w-full pl-10 pr-3 py-3 rounded-xl border text-sm font-bold outline-none"
                      style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "inherit" }}
                      onFocus={e => (e.target.style.borderColor = "var(--invicta-red)")}
                      onBlur={e => (e.target.style.borderColor = "var(--border)")}
                    />
                  </div>
                  <div className="flex-1 relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold"
                      style={{ color: "var(--invicta-red)" }}>$</span>
                    <input type="text" value={repair} onChange={e => setRepair(e.target.value)}
                      placeholder="45,000"
                      className="w-full pl-7 pr-3 py-3 rounded-xl border text-sm font-bold outline-none"
                      style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "inherit" }}
                      onFocus={e => (e.target.style.borderColor = "var(--invicta-red)")}
                      onBlur={e => (e.target.style.borderColor = "var(--border)")}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: "light",    label: "Light",    desc: "$15-25/sqft" },
                    { id: "moderate", label: "Moderate", desc: "$25-40/sqft" },
                    { id: "major",    label: "Major",    desc: "$40-60/sqft" },
                    { id: "gut",      label: "Full Gut", desc: "$60-80/sqft" },
                  ].map(c => (
                    <button key={c.id} onClick={() => applyCondition(c.id)}
                      className="px-3 py-2 rounded-xl text-left transition-all"
                      style={{
                        background: conditionLevel === c.id ? "var(--invicta-red)20" : "var(--surface-3)",
                        border: conditionLevel === c.id ? "1px solid var(--invicta-red)" : "1px solid var(--border)",
                      }}>
                      <p className="text-xs font-bold" style={{ color: conditionLevel === c.id ? "var(--invicta-red)" : "var(--foreground)" }}>
                        {c.label}
                      </p>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{c.desc}</p>
                    </button>
                  ))}
                </div>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  Enter sqft + pick condition → repair estimate auto-fills
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h2 className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--muted-foreground)" }}>
              Deal Parameters
            </h2>
            <div className="flex flex-col gap-5">
              <SliderRow label="MAO Factor" value={maoFactor} onChange={setMaoFactor}
                min={60} max={80} step={1} suffix="%" color="var(--invicta-purple)" />
              <SliderRow label="Closing Costs" value={closingPct} onChange={setClosingPct}
                min={1} max={6} step={0.5} suffix="%" color="var(--invicta-blue)" />
              <SliderRow label="Hold Period" value={holdMonths} onChange={setHoldMonths}
                min={1} max={12} step={1} suffix=" mo" color="var(--invicta-amber)" />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold tracking-wider uppercase"
                  style={{ color: "var(--muted-foreground)" }}>
                  Financing
                </label>
                <div className="flex gap-2">
                  {[["cash", "All Cash"], ["hard_money", "Hard Money"]].map(([val, label]) => (
                    <button key={val} onClick={() => setFinancing(val)}
                      className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: financing === val ? "var(--invicta-purple)20" : "var(--surface-3)",
                        color: financing === val ? "var(--invicta-purple)" : "var(--muted-foreground)",
                        border: financing === val ? "1px solid var(--invicta-purple)" : "1px solid var(--border)",
                      }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* results */}
        <div className="flex flex-col gap-4">

          {/* Quick Offer AI */}
          <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--invicta-purple)40" }}>
            <button onClick={() => setShowAi(v => !v)}
              className="w-full px-5 py-3.5 flex items-center justify-between"
              style={{ background: "var(--invicta-purple)10" }}>
              <div className="flex items-center gap-2">
                <Zap size={15} style={{ color: "var(--invicta-purple)" }} />
                <span className="font-bold text-sm" style={{ color: "var(--invicta-purple)" }}>AI Quick Offer</span>
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>— on the phone? use this</span>
              </div>
              {showAi ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showAi && (
              <div className="p-4 flex flex-col gap-3">
                <textarea
                  value={condition}
                  onChange={e => setCondition(e.target.value)}
                  placeholder="Describe condition in seller's words — 'needs new kitchen, roof is bad, hasn't been updated since the 80s'"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "inherit" }}
                  onFocus={e => (e.target.style.borderColor = "var(--invicta-purple)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
                <button onClick={runQuickOffer} disabled={aiLoading}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm"
                  style={{ background: "var(--invicta-purple)", color: "#fff" }}>
                  {aiLoading ? <><Loader2 size={14} className="animate-spin" />Analyzing...</> : <><Zap size={14} />Get AI Offer</>}
                </button>
                {aiResult && (
                  <div className="flex flex-col gap-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "AI Est. ARV", value: aiResult.arv ? "$" + Number(aiResult.arv).toLocaleString() : "—", color: "var(--invicta-blue)" },
                        { label: "Repair Range", value: aiResult.repairLow ? `$${Number(aiResult.repairLow).toLocaleString()}–$${Number(aiResult.repairHigh).toLocaleString()}` : "—", color: "var(--invicta-red)" },
                        { label: "MAO", value: aiResult.mao ? "$" + Number(aiResult.mao).toLocaleString() : "—", color: "var(--invicta-green)" },
                        { label: "Max Fee", value: aiResult.maxFee ? "$" + Number(aiResult.maxFee).toLocaleString() : "—", color: "var(--invicta-amber)" },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="rounded-xl p-3" style={{ background: "var(--surface-2)" }}>
                          <p className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>{label}</p>
                          <p className="font-bold" style={{ color }}>{value}</p>
                        </div>
                      ))}
                    </div>
                    {aiResult.repairBreakdown?.length > 0 && (
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {aiResult.repairBreakdown.map((r: string) => <p key={r}>• {r}</p>)}
                      </div>
                    )}
                    {aiResult.sellerScript && (
                      <div className="rounded-xl p-3" style={{ background: "var(--invicta-green)10", border: "1px solid var(--invicta-green)30" }}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold" style={{ color: "var(--invicta-green)" }}>Script — read this to the seller</p>
                          <button onClick={copyScript}
                            className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg"
                            style={{ background: "var(--invicta-green)20", color: "var(--invicta-green)" }}>
                            {copied ? <><Check size={11} />Copied</> : <><Copy size={11} />Copy</>}
                          </button>
                        </div>
                        <p className="text-sm italic leading-relaxed">"{aiResult.sellerScript}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* MAO highlight */}
          <div className="rounded-2xl border p-6 flex flex-col items-center text-center"
            style={{
              background: mao > 0 ? "var(--invicta-green)10" : "var(--surface)",
              borderColor: mao > 0 ? "var(--invicta-green)" : "var(--border)",
            }}>
            <p className="text-xs font-bold tracking-widest uppercase mb-2"
              style={{ color: "var(--muted-foreground)" }}>
              Maximum Allowable Offer
            </p>
            <p className="text-5xl font-bold mb-2" style={{ color: "var(--invicta-green)" }}>
              {fmt(mao)}
            </p>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              ARV × {maoFactor}% − repairs − closing − holding
            </p>
          </div>

          {/* deal verdict */}
          {askN > 0 && (
            <div className="rounded-2xl border p-5"
              style={{
                background: good ? "var(--invicta-green)08" : "var(--invicta-red)08",
                borderColor: good ? "var(--invicta-green)" : "var(--invicta-red)",
              }}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} style={{ color: good ? "var(--invicta-green)" : "var(--invicta-red)" }} />
                <span className="font-bold" style={{ color: good ? "var(--invicta-green)" : "var(--invicta-red)" }}>
                  {good ? "Deal looks solid" : "Deal is upside down"}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Ask Price",        value: fmt(askN),         color: "var(--invicta-amber)" },
                  { label: "Max Assignment",   value: fmt(maxAssign),    color: good ? "var(--invicta-green)" : "var(--invicta-red)" },
                  { label: "Your Fee Target",  value: fmt(assignN),      color: "var(--invicta-blue)" },
                  { label: "Buyer's Margin",   value: roi !== null ? `${roi.toFixed(1)}%` : "—", color: "var(--invicta-purple)" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between py-1.5 border-b last:border-0"
                    style={{ borderColor: "var(--border)" }}>
                    <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>{label}</span>
                    <span className="text-sm font-bold" style={{ color }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* breakdown */}
          <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h2 className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--muted-foreground)" }}>
              Cost Breakdown
            </h2>
            <div className="flex flex-col gap-2.5">
              {[
                { label: `ARV × ${maoFactor}%`,           value: fmt(arvN * (maoFactor / 100)), color: "var(--invicta-blue)" },
                { label: "− Repair Costs",                 value: fmt(-repairN),                  color: "var(--invicta-red)" },
                { label: `− Closing (${closingPct}%)`,     value: fmt(-closingCosts),             color: "var(--invicta-amber)" },
                { label: `− Holding (${holdMonths} mo)`,   value: fmt(-holdingCosts),             color: "var(--invicta-amber)", hidden: financing !== "hard_money" },
                { label: "= MAO",                          value: fmt(mao),                       color: "var(--invicta-green)", bold: true },
              ].filter(r => !r.hidden).map(({ label, value, color, bold }) => (
                <div key={label} className="flex items-center justify-between py-1 border-b last:border-0"
                  style={{ borderColor: "var(--border)" }}>
                  <span className={`text-sm ${bold ? "font-bold" : ""}`}
                    style={{ color: bold ? "var(--foreground)" : "var(--muted-foreground)" }}>
                    {label}
                  </span>
                  <span className={`text-sm font-bold`} style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    </PageShell>
  );
}

export default function CalculatorPage() {
  return (
    <Suspense>
      <CalculatorContent />
    </Suspense>
  );
}

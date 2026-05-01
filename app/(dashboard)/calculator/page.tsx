"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Calculator, TrendingUp, DollarSign, Wrench, ArrowRight, Info } from "lucide-react";
import PageShell from "@/components/PageShell";

function fmt(n: number) {
  return isNaN(n) || !isFinite(n) ? "—" : "$" + Math.round(n).toLocaleString();
}

function parseDollar(s: string): number {
  const n = Number(s.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

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

  const [arv, setArv] = useState(params.get("arv") ?? "");
  const [repair, setRepair] = useState(params.get("repair") ?? "");
  const [askPrice, setAskPrice] = useState(params.get("ask") ?? "");
  const [assignFee, setAssignFee] = useState("10000");
  const [closingPct, setClosingPct] = useState(3);
  const [holdMonths, setHoldMonths] = useState(3);
  const [maoFactor, setMaoFactor] = useState(70);
  const [financing, setFinancing] = useState("cash");

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

  return (
    <PageShell title="Calculator" subtitle="MAO & assignment fee">
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
              <InputRow label="Repair Estimate" value={repair} onChange={setRepair}
                placeholder="45,000" color="var(--invicta-red)"
                hint="Rehab costs buyer pays" />
              <InputRow label="Owner Ask Price" value={askPrice} onChange={setAskPrice}
                placeholder="165,000" color="var(--invicta-amber)" />
              <InputRow label="Your Assignment Fee" value={assignFee} onChange={setAssignFee}
                placeholder="10,000" color="var(--invicta-green)" />
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

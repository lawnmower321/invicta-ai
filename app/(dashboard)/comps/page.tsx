"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search, MapPin, TrendingUp, Home, Calendar,
  Ruler, RefreshCw, Info, AlertCircle,
} from "lucide-react";
import PageShell from "@/components/PageShell";

type Comp = {
  id: string;
  address: string;
  salePrice: number;
  sqft: number;
  beds: number;
  baths: number;
  soldDate: string;
  distance: string;
  pricePerSqft: number;
  condition: "similar" | "superior" | "inferior";
};

const CONDITION_LABEL: Record<string, { label: string; color: string }> = {
  similar:  { label: "Similar",  color: "var(--invicta-blue)" },
  superior: { label: "Superior", color: "var(--invicta-green)" },
  inferior: { label: "Inferior", color: "var(--invicta-amber)" },
};

function fmt(n: number) { return "$" + n.toLocaleString(); }

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function mapCondition(ppsf: number, avgPpsf: number): Comp["condition"] {
  if (ppsf > avgPpsf * 1.08) return "superior";
  if (ppsf < avgPpsf * 0.92) return "inferior";
  return "similar";
}

function CompsContent() {
  const params = useSearchParams();
  const [address, setAddress] = useState(params.get("address") ?? "");
  const [radius, setRadius] = useState("1");
  const [comps, setComps] = useState<Comp[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const preloadedArv = params.get("arv");

  useEffect(() => {
    if (params.get("address")) runSearch();
  }, []);

  async function runSearch() {
    if (!address.trim()) return;
    setLoading(true);
    setSearched(false);
    setError("");
    setComps([]);

    try {
      const res = await fetch(`/api/comps?address=${encodeURIComponent(address.trim())}&radius=${radius}`);
      const json = await res.json();

      if (!res.ok) {
        setError(`${json.error ?? "Failed to fetch comps"} — ${json.detail ?? ""}`);
        setLoading(false);
        setSearched(true);
        return;
      }

      const raw: any[] = json.comparables ?? [];
      if (raw.length === 0) {
        setSearched(true);
        setLoading(false);
        return;
      }

      // calculate avg ppsf first so we can classify condition
      const ppsfList = raw
        .filter(c => c.squareFootage && c.lastSalePrice)
        .map(c => Math.round(c.lastSalePrice / c.squareFootage));
      const avgPpsf = ppsfList.length ? Math.round(ppsfList.reduce((a, b) => a + b, 0) / ppsfList.length) : 0;

      const mapped: Comp[] = raw.map((c, i) => {
        const ppsf = c.squareFootage ? Math.round(c.lastSalePrice / c.squareFootage) : 0;
        return {
          id: c.id ?? String(i),
          address: c.formattedAddress ?? c.address ?? "Unknown",
          salePrice: c.lastSalePrice ?? 0,
          sqft: c.squareFootage ?? 0,
          beds: c.bedrooms ?? 0,
          baths: c.bathrooms ?? 0,
          soldDate: c.lastSaleDate ? fmtDate(c.lastSaleDate) : "—",
          distance: c.distance != null ? `${c.distance.toFixed(1)} mi` : "—",
          pricePerSqft: ppsf,
          condition: avgPpsf ? mapCondition(ppsf, avgPpsf) : "similar",
        };
      });

      setComps(mapped);
    } catch {
      setError("Network error — check your connection");
    }

    setLoading(false);
    setSearched(true);
  }

  const avgPrice = comps.length
    ? Math.round(comps.reduce((s, c) => s + c.salePrice, 0) / comps.length)
    : 0;
  const avgPpsf = comps.length
    ? Math.round(comps.reduce((s, c) => s + c.pricePerSqft, 0) / comps.length)
    : 0;
  const suggestedArv = avgPrice ? Math.round(avgPrice * 0.97) : 0;

  return (
    <PageShell title="Comps Tool" subtitle="Pull comparable sales">
      {/* search bar */}
      <div className="rounded-2xl border p-5 mb-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[260px] relative">
            <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: "var(--muted-foreground)" }} />
            <input type="text" value={address} onChange={e => setAddress(e.target.value)}
              onKeyDown={e => e.key === "Enter" && runSearch()}
              placeholder="211 Cedar Ln, New Rochelle NY"
              className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "inherit" }}
              onFocus={e => (e.target.style.borderColor = "var(--invicta-purple)")}
              onBlur={e => (e.target.style.borderColor = "var(--border)")}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold" style={{ color: "var(--muted-foreground)" }}>Radius</span>
            {["0.5", "1", "1.5", "2"].map(r => (
              <button key={r} onClick={() => setRadius(r)}
                className="px-3 py-2 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: radius === r ? "var(--invicta-purple)20" : "var(--surface-3)",
                  color: radius === r ? "var(--invicta-purple)" : "var(--muted-foreground)",
                  border: radius === r ? "1px solid var(--invicta-purple)" : "1px solid var(--border)",
                }}>
                {r} mi
              </button>
            ))}
          </div>
          <button onClick={runSearch} disabled={loading}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "var(--invicta-purple)", color: "#fff" }}>
            {loading ? <RefreshCw size={15} className="animate-spin" /> : <Search size={15} />}
            {loading ? "Searching..." : "Run Comps"}
          </button>
        </div>
      </div>

      {/* error */}
      {error && (
        <div className="rounded-2xl border p-4 mb-6 flex items-center gap-3"
          style={{ background: "var(--invicta-red)10", borderColor: "var(--invicta-red)40" }}>
          <AlertCircle size={16} style={{ color: "var(--invicta-red)" }} />
          <p className="text-sm" style={{ color: "var(--invicta-red)" }}>{error}</p>
        </div>
      )}

      {/* results */}
      {searched && !error && comps.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Suggested ARV",  value: fmt(suggestedArv), color: "var(--invicta-green)",  accent: true },
              { label: "Avg Sale Price", value: fmt(avgPrice),     color: "var(--invicta-blue)" },
              { label: "Avg $/Sq Ft",    value: `$${avgPpsf}/sf`,  color: "var(--invicta-purple)" },
              { label: "Comps Found",    value: `${comps.length}`, color: "var(--invicta-amber)" },
            ].map(({ label, value, color, accent }) => (
              <div key={label} className="rounded-2xl border p-4"
                style={{ background: accent ? `${color}12` : "var(--surface)", borderColor: accent ? color : "var(--border)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>{label}</p>
                <p className="text-2xl font-bold" style={{ color }}>{value}</p>
                {accent && preloadedArv && (
                  <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                    Your est: {fmt(Number(preloadedArv))}
                    {Number(preloadedArv) > suggestedArv
                      ? <span style={{ color: "var(--invicta-amber)" }}> (high)</span>
                      : <span style={{ color: "var(--invicta-green)" }}> (aligned)</span>}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
              <h2 className="font-bold">Comparable Sales</h2>
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
                <Info size={12} /> Within {radius} mile · via Rentcast
              </div>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {comps.map(comp => {
                const cond = CONDITION_LABEL[comp.condition];
                return (
                  <div key={comp.id} className="px-5 py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <MapPin size={12} style={{ color: cond.color }} />
                        <p className="text-sm font-bold truncate">{comp.address}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                          style={{ background: `${cond.color}20`, color: cond.color }}>
                          {cond.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs flex-wrap" style={{ color: "var(--muted-foreground)" }}>
                        {comp.beds > 0 && <span className="flex items-center gap-1"><Home size={10} />{comp.beds}bd / {comp.baths}ba</span>}
                        {comp.sqft > 0 && <span className="flex items-center gap-1"><Ruler size={10} />{comp.sqft.toLocaleString()} sf</span>}
                        <span className="flex items-center gap-1"><Calendar size={10} />{comp.soldDate}</span>
                        <span>{comp.distance}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold">{fmt(comp.salePrice)}</p>
                      {comp.pricePerSqft > 0 && (
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>${comp.pricePerSqft}/sf</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {searched && !error && comps.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed"
          style={{ borderColor: "var(--border)" }}>
          <TrendingUp size={32} className="mb-3" style={{ color: "var(--muted-foreground)" }} />
          <p className="font-bold mb-1">No comps found</p>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Try expanding the radius or adjusting the address</p>
        </div>
      )}

      {!searched && !loading && (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed"
          style={{ borderColor: "var(--border)" }}>
          <TrendingUp size={32} className="mb-3" style={{ color: "var(--muted-foreground)" }} />
          <p className="font-bold mb-1">Enter an address to pull comps</p>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Real sales data via Rentcast · results cached 24h
          </p>
        </div>
      )}
    </PageShell>
  );
}

export default function CompsPage() {
  return <Suspense><CompsContent /></Suspense>;
}

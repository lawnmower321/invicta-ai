"use client";

import { useState } from "react";
import {
  Plus, Search, Users, Phone, Mail, MapPin,
  DollarSign, Home, Tag, X, CheckCircle2,
} from "lucide-react";
import PageShell from "@/components/PageShell";

type Buyer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  markets: string[];
  minPrice: number;
  maxPrice: number;
  propTypes: string[];
  cashProof: boolean;
  dealsCompleted: number;
  notes: string;
};

const INITIAL_BUYERS: Buyer[] = [
  { id: "1", name: "Mike Romano",   phone: "(914) 555-0141", email: "mromano@invest.com", markets: ["Westchester", "Bronx"], minPrice: 100000, maxPrice: 350000, propTypes: ["SFR", "MFR"], cashProof: true,  dealsCompleted: 14, notes: "Fast closer, 7-day preferred." },
  { id: "2", name: "Sandra Lee",    phone: "(646) 555-0193", email: "slee@realfunds.co",  markets: ["Manhattan", "Brooklyn"], minPrice: 300000, maxPrice: 900000, propTypes: ["MFR", "Mixed-Use"], cashProof: true,  dealsCompleted: 7,  notes: "Prefers 10+ units but flexible." },
  { id: "3", name: "Devon Harris",  phone: "(718) 555-0227", email: "dharris@cashco.io",  markets: ["Westchester", "Rockland"], minPrice: 80000, maxPrice: 280000, propTypes: ["SFR"], cashProof: false, dealsCompleted: 4,  notes: "New buyer — still vetting. Has shown proof of concept." },
  { id: "4", name: "Priya Nair",    phone: "(212) 555-0384", email: "pnair@naircap.com",  markets: ["NYC", "Long Island"], minPrice: 200000, maxPrice: 700000, propTypes: ["SFR", "Condo"], cashProof: true,  dealsCompleted: 22, notes: "Responsive and reliable." },
  { id: "5", name: "Carlos Vega",   phone: "(347) 555-0176", email: "cvega@vegabuy.com",  markets: ["Bronx", "Yonkers"],  minPrice: 75000,  maxPrice: 220000, propTypes: ["SFR", "MFR"], cashProof: true,  dealsCompleted: 9,  notes: "Focuses on distressed properties." },
];

const EMPTY_FORM = {
  name: "", phone: "", email: "", markets: "",
  minPrice: "", maxPrice: "", propTypes: "", notes: "",
};

const PROP_TYPE_COLORS: Record<string, string> = {
  SFR: "var(--invicta-blue)",
  MFR: "var(--invicta-purple)",
  Condo: "var(--invicta-amber)",
  "Mixed-Use": "var(--invicta-green)",
};

function fmt(n: number) { return "$" + n.toLocaleString(); }

export default function BuyersPage() {
  const [buyers, setBuyers] = useState<Buyer[]>(INITIAL_BUYERS);
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selected, setSelected] = useState<Buyer | null>(null);

  const filtered = buyers.filter(b =>
    b.name.toLowerCase().includes(query.toLowerCase()) ||
    b.markets.some(m => m.toLowerCase().includes(query.toLowerCase()))
  );

  function addBuyer() {
    if (!form.name.trim()) return;
    const b: Buyer = {
      id: Date.now().toString(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      markets: form.markets.split(",").map(s => s.trim()).filter(Boolean),
      minPrice: Number(form.minPrice.replace(/\D/g, "")) || 0,
      maxPrice: Number(form.maxPrice.replace(/\D/g, "")) || 0,
      propTypes: form.propTypes.split(",").map(s => s.trim()).filter(Boolean),
      cashProof: false,
      dealsCompleted: 0,
      notes: form.notes.trim(),
    };
    setBuyers(prev => [b, ...prev]);
    setForm(EMPTY_FORM);
    setShowModal(false);
  }

  return (
    <PageShell
      title="Cash Buyers"
      subtitle={`${buyers.length} in network`}
      action={
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90"
          style={{ background: "var(--invicta-blue)", color: "#fff" }}>
          <Plus size={16} />
          Add Buyer
        </button>
      }
    >
      <div>
      {/* search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2"
          style={{ color: "var(--muted-foreground)" }} />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search buyers or markets..."
          className="w-full pl-11 pr-4 py-3 rounded-xl border text-sm outline-none transition-all"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
            fontFamily: "inherit",
          }}
          onFocus={e => (e.target.style.borderColor = "var(--invicta-blue)")}
          onBlur={e => (e.target.style.borderColor = "var(--border)")}
        />
      </div>

      {/* buyer grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(buyer => (
          <button key={buyer.id} onClick={() => setSelected(buyer)}
            className="rounded-2xl border p-5 text-left transition-all hover:border-opacity-70 group"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
                    style={{ background: "var(--invicta-blue)20", color: "var(--invicta-blue)" }}>
                    {buyer.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                  </div>
                  <h3 className="font-bold">{buyer.name}</h3>
                  {buyer.cashProof && (
                    <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: "var(--invicta-green)15", color: "var(--invicta-green)" }}>
                      <CheckCircle2 size={10} />
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {buyer.dealsCompleted} deals closed
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {buyer.markets.map(m => (
                <span key={m} className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: "var(--invicta-blue)15", color: "var(--invicta-blue)" }}>
                  <MapPin size={9} className="inline mr-1" />{m}
                </span>
              ))}
              {buyer.propTypes.map(t => (
                <span key={t} className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: `${PROP_TYPE_COLORS[t] ?? "var(--invicta-purple)"}20`, color: PROP_TYPE_COLORS[t] ?? "var(--invicta-purple)" }}>
                  {t}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-1">
                <DollarSign size={12} style={{ color: "var(--muted-foreground)" }} />
                <span className="text-xs font-bold">{fmt(buyer.minPrice)} – {fmt(buyer.maxPrice)}</span>
              </div>
              <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                <span>{buyer.phone}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* buyer detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-end"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="h-full w-full max-w-md border-l p-6 overflow-y-auto flex flex-col gap-5"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{selected.name}</h2>
              <button onClick={() => setSelected(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-60 transition-opacity"
                style={{ background: "var(--surface-3)" }}>
                <X size={14} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <a href={`tel:${selected.phone}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:opacity-70 transition-opacity"
                style={{ background: "var(--surface-2)" }}>
                <Phone size={14} style={{ color: "var(--invicta-green)" }} />{selected.phone}
              </a>
              <a href={`mailto:${selected.email}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:opacity-70 transition-opacity"
                style={{ background: "var(--surface-2)" }}>
                <Mail size={14} style={{ color: "var(--invicta-blue)" }} />{selected.email}
              </a>
            </div>
            <div className="rounded-xl p-4" style={{ background: "var(--surface-2)" }}>
              <p className="text-xs font-bold tracking-widest uppercase mb-2"
                style={{ color: "var(--muted-foreground)" }}>Buy Box</p>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: "var(--muted-foreground)" }}>Price Range</span>
                  <span className="font-bold">{fmt(selected.minPrice)} – {fmt(selected.maxPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--muted-foreground)" }}>Markets</span>
                  <span className="font-bold">{selected.markets.join(", ")}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--muted-foreground)" }}>Prop Types</span>
                  <span className="font-bold">{selected.propTypes.join(", ")}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--muted-foreground)" }}>Deals Closed</span>
                  <span className="font-bold" style={{ color: "var(--invicta-green)" }}>
                    {selected.dealsCompleted}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: "var(--muted-foreground)" }}>Cash Proof</span>
                  {selected.cashProof
                    ? <span className="flex items-center gap-1 text-xs font-bold" style={{ color: "var(--invicta-green)" }}>
                        <CheckCircle2 size={12} /> Verified
                      </span>
                    : <span className="text-xs" style={{ color: "var(--invicta-amber)" }}>Pending</span>}
                </div>
              </div>
            </div>
            {selected.notes && (
              <div>
                <p className="text-xs font-bold tracking-widest uppercase mb-2"
                  style={{ color: "var(--muted-foreground)" }}>Notes</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                  {selected.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* add buyer modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="w-full max-w-md rounded-2xl border p-6"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Add Cash Buyer</h2>
              <button onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-60"
                style={{ background: "var(--surface-3)" }}>
                <X size={14} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { key: "name",      label: "Full Name *",              placeholder: "John Smith" },
                { key: "phone",     label: "Phone",                    placeholder: "(914) 555-0000" },
                { key: "email",     label: "Email",                    placeholder: "john@example.com" },
                { key: "markets",   label: "Markets (comma-separated)", placeholder: "Westchester, Bronx" },
                { key: "minPrice",  label: "Min Price",                placeholder: "$100,000" },
                { key: "maxPrice",  label: "Max Price",                placeholder: "$400,000" },
                { key: "propTypes", label: "Prop Types (SFR, MFR...)", placeholder: "SFR, MFR" },
                { key: "notes",     label: "Notes",                    placeholder: "Fast closer..." },
              ].map(({ key, label, placeholder }) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-xs font-bold tracking-wider uppercase"
                    style={{ color: "var(--muted-foreground)" }}>{label}</label>
                  <input
                    type="text"
                    value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{
                      background: "var(--surface-2)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                      fontFamily: "inherit",
                    }}
                    onFocus={e => (e.target.style.borderColor = "var(--invicta-blue)")}
                    onBlur={e => (e.target.style.borderColor = "var(--border)")}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: "var(--surface-3)", color: "var(--muted-foreground)" }}>
                Cancel
              </button>
              <button onClick={addBuyer}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: "var(--invicta-blue)", color: "#fff" }}>
                Add Buyer
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </PageShell>
  );
}

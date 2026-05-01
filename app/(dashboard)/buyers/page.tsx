"use client";

import { useState, useEffect } from "react";
import {
  Plus, Search, Phone, Mail, MapPin,
  DollarSign, CheckCircle2, X, Loader2,
} from "lucide-react";
import PageShell from "@/components/PageShell";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

type Buyer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  markets: string[];
  min_price: number | null;
  max_price: number | null;
  prop_types: string[];
  cash_proof: boolean;
  deals_completed: number;
  notes: string | null;
};

const EMPTY_FORM = {
  name: "", phone: "", email: "", markets: "",
  min_price: "", max_price: "", prop_types: "", notes: "",
};

const PROP_TYPE_COLORS: Record<string, string> = {
  SFR: "var(--invicta-blue)",
  MFR: "var(--invicta-purple)",
  Condo: "var(--invicta-amber)",
  "Mixed-Use": "var(--invicta-green)",
};

function fmt(n: number) { return "$" + n.toLocaleString(); }

export default function BuyersPage() {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Buyer | null>(null);

  useEffect(() => { fetchBuyers(); }, []);

  async function fetchBuyers() {
    const { data } = await supabase
      .from("buyers")
      .select("*")
      .order("created_at", { ascending: false });
    setBuyers(data ?? []);
    setLoading(false);
  }

  const filtered = buyers.filter(b =>
    b.name.toLowerCase().includes(query.toLowerCase()) ||
    b.markets.some(m => m.toLowerCase().includes(query.toLowerCase()))
  );

  async function addBuyer() {
    if (!form.name.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("buyers").insert({
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      markets: form.markets.split(",").map(s => s.trim()).filter(Boolean),
      min_price: form.min_price ? Number(form.min_price.replace(/\D/g, "")) : null,
      max_price: form.max_price ? Number(form.max_price.replace(/\D/g, "")) : null,
      prop_types: form.prop_types.split(",").map(s => s.trim()).filter(Boolean),
      cash_proof: false,
      deals_completed: 0,
      notes: form.notes.trim() || null,
      created_by: user?.id ?? null,
    });
    setForm(EMPTY_FORM);
    setShowModal(false);
    setSaving(false);
    fetchBuyers();
  }

  return (
    <PageShell
      title="Cash Buyers"
      subtitle={loading ? "loading..." : `${buyers.length} in network`}
      action={
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90"
          style={{ background: "var(--invicta-blue)", color: "#fff" }}>
          <Plus size={16} /> Add Buyer
        </button>
      }
    >
      {/* search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2"
          style={{ color: "var(--muted-foreground)" }} />
        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search buyers or markets..."
          className="w-full pl-11 pr-4 py-3 rounded-xl border text-sm outline-none transition-all"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "inherit" }}
          onFocus={e => (e.target.style.borderColor = "var(--invicta-blue)")}
          onBlur={e => (e.target.style.borderColor = "var(--border)")}
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--invicta-blue)" }} />
        </div>
      )}

      {!loading && buyers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed"
          style={{ borderColor: "var(--border)" }}>
          <p className="font-bold mb-1">No buyers yet</p>
          <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
            Add your first cash buyer to start building your network
          </p>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm"
            style={{ background: "var(--invicta-blue)", color: "#fff" }}>
            <Plus size={14} /> Add Buyer
          </button>
        </div>
      )}

      {/* buyer grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(buyer => (
            <button key={buyer.id} onClick={() => setSelected(buyer)}
              className="rounded-2xl border p-5 text-left transition-all hover:border-opacity-70"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
                  style={{ background: "var(--invicta-blue)20", color: "var(--invicta-blue)" }}>
                  {buyer.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold">{buyer.name}</h3>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {buyer.deals_completed} deals closed
                  </p>
                </div>
                {buyer.cash_proof && (
                  <span className="ml-auto flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "var(--invicta-green)15", color: "var(--invicta-green)" }}>
                    <CheckCircle2 size={10} /> Verified
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {buyer.markets.map(m => (
                  <span key={m} className="text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{ background: "var(--invicta-blue)15", color: "var(--invicta-blue)" }}>
                    <MapPin size={9} className="inline mr-1" />{m}
                  </span>
                ))}
                {buyer.prop_types.map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{ background: `${PROP_TYPE_COLORS[t] ?? "var(--invicta-purple)"}20`, color: PROP_TYPE_COLORS[t] ?? "var(--invicta-purple)" }}>
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-1">
                  <DollarSign size={12} style={{ color: "var(--muted-foreground)" }} />
                  <span className="text-xs font-bold">
                    {buyer.min_price ? fmt(buyer.min_price) : "—"} – {buyer.max_price ? fmt(buyer.max_price) : "—"}
                  </span>
                </div>
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{buyer.phone ?? ""}</span>
              </div>
            </button>
          ))}
        </div>
      )}

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
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-60"
                style={{ background: "var(--surface-3)" }}>
                <X size={14} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {selected.phone && (
                <a href={`tel:${selected.phone}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:opacity-70"
                  style={{ background: "var(--surface-2)" }}>
                  <Phone size={14} style={{ color: "var(--invicta-green)" }} />{selected.phone}
                </a>
              )}
              {selected.email && (
                <a href={`mailto:${selected.email}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:opacity-70"
                  style={{ background: "var(--surface-2)" }}>
                  <Mail size={14} style={{ color: "var(--invicta-blue)" }} />{selected.email}
                </a>
              )}
            </div>
            <div className="rounded-xl p-4" style={{ background: "var(--surface-2)" }}>
              <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "var(--muted-foreground)" }}>Buy Box</p>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: "var(--muted-foreground)" }}>Price Range</span>
                  <span className="font-bold">
                    {selected.min_price ? fmt(selected.min_price) : "—"} – {selected.max_price ? fmt(selected.max_price) : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--muted-foreground)" }}>Markets</span>
                  <span className="font-bold">{selected.markets.join(", ") || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--muted-foreground)" }}>Prop Types</span>
                  <span className="font-bold">{selected.prop_types.join(", ") || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--muted-foreground)" }}>Deals Closed</span>
                  <span className="font-bold" style={{ color: "var(--invicta-green)" }}>{selected.deals_completed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: "var(--muted-foreground)" }}>Cash Proof</span>
                  {selected.cash_proof
                    ? <span className="flex items-center gap-1 text-xs font-bold" style={{ color: "var(--invicta-green)" }}>
                        <CheckCircle2 size={12} /> Verified
                      </span>
                    : <span className="text-xs" style={{ color: "var(--invicta-amber)" }}>Pending</span>}
                </div>
              </div>
            </div>
            {selected.notes && (
              <div>
                <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "var(--muted-foreground)" }}>Notes</p>
                <p className="text-sm leading-relaxed">{selected.notes}</p>
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
                { key: "name",       label: "Full Name *",               placeholder: "John Smith" },
                { key: "phone",      label: "Phone",                     placeholder: "(914) 555-0000" },
                { key: "email",      label: "Email",                     placeholder: "john@example.com" },
                { key: "markets",    label: "Markets (comma-separated)", placeholder: "Westchester, Bronx" },
                { key: "min_price",  label: "Min Price",                 placeholder: "$100,000" },
                { key: "max_price",  label: "Max Price",                 placeholder: "$400,000" },
                { key: "prop_types", label: "Prop Types (SFR, MFR...)",  placeholder: "SFR, MFR" },
                { key: "notes",      label: "Notes",                     placeholder: "Fast closer..." },
              ].map(({ key, label, placeholder }) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-xs font-bold tracking-wider uppercase"
                    style={{ color: "var(--muted-foreground)" }}>{label}</label>
                  <input type="text" value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "inherit" }}
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
              <button onClick={addBuyer} disabled={saving}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                style={{ background: "var(--invicta-blue)", color: "#fff" }}>
                {saving && <Loader2 size={14} className="animate-spin" />}
                Add Buyer
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

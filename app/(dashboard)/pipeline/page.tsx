"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Plus, MapPin, DollarSign, User, ArrowUpRight,
  TrendingUp, X, ChevronDown,
} from "lucide-react";

const STAGES = [
  { id: "new",       label: "New Lead",          color: "var(--invicta-blue)",   bg: "var(--invicta-blue)18" },
  { id: "contacted", label: "Contacted",          color: "var(--invicta-amber)",  bg: "var(--invicta-amber)18" },
  { id: "qualified", label: "Qualified",          color: "var(--invicta-purple)", bg: "var(--invicta-purple)18" },
  { id: "offer",     label: "Offer Made",         color: "var(--invicta-green)",  bg: "var(--invicta-green)18" },
  { id: "contract",  label: "Under Contract",     color: "var(--invicta-green)",  bg: "var(--invicta-green)25" },
  { id: "closed",    label: "Closed / Assigned",  color: "var(--invicta-red)",    bg: "var(--invicta-red)18" },
];

type Deal = {
  id: string;
  stage: string;
  address: string;
  owner: string;
  askPrice: number | null;
  arv: number | null;
};

const INITIAL_DEALS: Deal[] = [
  { id: "1", stage: "new",       address: "142 Oak St, Peekskill NY",      owner: "John Donovan",  askPrice: null,   arv: 280000 },
  { id: "2", stage: "new",       address: "88 Maple Ave, Yonkers NY",      owner: "S. Martinez",   askPrice: null,   arv: 320000 },
  { id: "3", stage: "contacted", address: "54 Pine Rd, White Plains NY",   owner: "R. Thompson",   askPrice: 185000, arv: 310000 },
  { id: "4", stage: "qualified", address: "7 Elm Dr, Mount Vernon NY",     owner: "K. Williams",   askPrice: 140000, arv: 245000 },
  { id: "5", stage: "offer",     address: "211 Cedar Ln, New Rochelle NY", owner: "D. Foster",     askPrice: 165000, arv: 290000 },
  { id: "6", stage: "contract",  address: "33 Birch Blvd, Ossining NY",   owner: "P. Chang",      askPrice: 178000, arv: 305000 },
  { id: "7", stage: "closed",    address: "99 Walnut St, Tarrytown NY",    owner: "M. Garcia",     askPrice: 155000, arv: 270000 },
];

const EMPTY_FORM = { address: "", owner: "", askPrice: "", arv: "" };

function fmt(n: number) {
  return "$" + n.toLocaleString();
}

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [dragging, setDragging] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const dragId = useRef<string | null>(null);

  function onDragStart(id: string) {
    dragId.current = id;
    setDragging(id);
  }

  function onDragOver(e: React.DragEvent, stageId: string) {
    e.preventDefault();
    setOverCol(stageId);
  }

  function onDrop(stageId: string) {
    if (!dragId.current) return;
    setDeals(prev =>
      prev.map(d => d.id === dragId.current ? { ...d, stage: stageId } : d)
    );
    setDragging(null);
    setOverCol(null);
    dragId.current = null;
  }

  function onDragEnd() {
    setDragging(null);
    setOverCol(null);
  }

  function addDeal() {
    if (!form.address.trim()) return;
    const newDeal: Deal = {
      id: Date.now().toString(),
      stage: "new",
      address: form.address.trim(),
      owner: form.owner.trim() || "Unknown",
      askPrice: form.askPrice ? Number(form.askPrice.replace(/\D/g, "")) : null,
      arv: form.arv ? Number(form.arv.replace(/\D/g, "")) : null,
    };
    setDeals(prev => [newDeal, ...prev]);
    setForm(EMPTY_FORM);
    setShowModal(false);
  }

  const totalValue = deals
    .filter(d => d.stage !== "closed" && d.askPrice)
    .reduce((sum, d) => sum + (d.askPrice ?? 0), 0);

  return (
    <div className="flex flex-col h-screen overflow-hidden">

      {/* header */}
      <div className="px-8 pt-8 pb-4 flex-shrink-0">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-1"
              style={{ color: "var(--muted-foreground)" }}>
              Deal Management
            </p>
            <h1 className="text-3xl font-bold tracking-wide">Pipeline</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Active Value</p>
              <p className="text-xl font-bold" style={{ color: "var(--invicta-green)" }}>
                {totalValue > 0 ? fmt(totalValue) : "—"}
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: "var(--invicta-green)", color: "#000" }}>
              <Plus size={16} />
              Add Lead
            </button>
          </div>
        </div>

        {/* stage legend */}
        <div className="flex items-center gap-4 overflow-x-auto pb-1">
          {STAGES.map(s => {
            const count = deals.filter(d => d.stage === s.id).length;
            return (
              <div key={s.id} className="flex items-center gap-1.5 flex-shrink-0">
                <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                <span className="text-xs font-bold" style={{ color: "var(--muted-foreground)" }}>
                  {s.label}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: s.bg, color: s.color }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* kanban board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-8 pb-8">
        <div className="flex gap-4 h-full" style={{ minWidth: `${STAGES.length * 288}px` }}>
          {STAGES.map(stage => {
            const stageDeals = deals.filter(d => d.stage === stage.id);
            const isOver = overCol === stage.id;

            return (
              <div
                key={stage.id}
                className="flex flex-col flex-shrink-0 rounded-2xl border transition-all"
                style={{
                  width: 272,
                  background: isOver ? stage.bg : "var(--surface)",
                  borderColor: isOver ? stage.color : "var(--border)",
                }}
                onDragOver={e => onDragOver(e, stage.id)}
                onDrop={() => onDrop(stage.id)}
              >
                {/* column header */}
                <div className="px-4 pt-4 pb-3 flex items-center justify-between flex-shrink-0 border-b"
                  style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: stage.color }} />
                    <span className="text-sm font-bold tracking-wide">{stage.label}</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: stage.bg, color: stage.color }}>
                    {stageDeals.length}
                  </span>
                </div>

                {/* cards */}
                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
                  {stageDeals.length === 0 && (
                    <div className="flex-1 flex items-center justify-center rounded-xl border border-dashed"
                      style={{ borderColor: "var(--border)", minHeight: 80 }}>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        Drop deals here
                      </p>
                    </div>
                  )}
                  {stageDeals.map(deal => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      stage={stage}
                      isDragging={dragging === deal.id}
                      onDragStart={() => onDragStart(deal.id)}
                      onDragEnd={onDragEnd}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* add lead modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="w-full max-w-md rounded-2xl border p-6"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Add New Lead</h2>
              <button onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-60"
                style={{ background: "var(--surface-3)" }}>
                <X size={14} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <Field label="Property Address *" placeholder="123 Main St, City ST">
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="123 Main St, White Plains NY"
                  className="input-field"
                  autoFocus
                />
              </Field>
              <Field label="Owner Name" placeholder="">
                <input
                  type="text"
                  value={form.owner}
                  onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
                  placeholder="John Smith"
                  className="input-field"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ask Price">
                  <input
                    type="text"
                    value={form.askPrice}
                    onChange={e => setForm(f => ({ ...f, askPrice: e.target.value }))}
                    placeholder="$175,000"
                    className="input-field"
                  />
                </Field>
                <Field label="Est. ARV">
                  <input
                    type="text"
                    value={form.arv}
                    onChange={e => setForm(f => ({ ...f, arv: e.target.value }))}
                    placeholder="$290,000"
                    className="input-field"
                  />
                </Field>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-70"
                style={{ background: "var(--surface-3)", color: "var(--muted-foreground)" }}>
                Cancel
              </button>
              <button onClick={addDeal}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
                style={{ background: "var(--invicta-green)", color: "#000" }}>
                Add to Pipeline
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .input-field {
          width: 100%;
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--foreground);
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s;
          font-family: inherit;
        }
        .input-field:focus {
          border-color: var(--invicta-green);
        }
        .input-field::placeholder {
          color: var(--muted-foreground);
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; placeholder?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold tracking-wider uppercase"
        style={{ color: "var(--muted-foreground)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function DealCard({
  deal, stage, isDragging, onDragStart, onDragEnd,
}: {
  deal: Deal;
  stage: typeof STAGES[0];
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const mao = deal.arv ? Math.round(deal.arv * 0.7 * 0.85) : null;
  const spread = deal.askPrice && mao ? mao - deal.askPrice : null;

  return (
    <Link href={`/leads/${deal.id}`}>
      <div
        draggable
        onDragStart={e => { e.stopPropagation(); onDragStart(); }}
        onDragEnd={onDragEnd}
        className="rounded-xl border p-3.5 cursor-grab active:cursor-grabbing transition-all group relative"
        style={{
          background: "var(--surface-2)",
          borderColor: isDragging ? stage.color : "var(--border)",
          opacity: isDragging ? 0.4 : 1,
          borderLeftWidth: 3,
          borderLeftColor: stage.color,
          transform: isDragging ? "rotate(1deg)" : "none",
        }}>

        {/* address */}
        <div className="flex items-start gap-2 mb-2.5">
          <MapPin size={13} className="flex-shrink-0 mt-0.5" style={{ color: stage.color }} />
          <p className="text-sm font-bold leading-snug">{deal.address}</p>
        </div>

        {/* owner */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <User size={11} style={{ color: "var(--muted-foreground)" }} />
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{deal.owner}</p>
        </div>

        {/* financials */}
        <div className="flex items-center gap-2 pt-2.5 border-t" style={{ borderColor: "var(--border)" }}>
          {deal.askPrice ? (
            <div className="flex items-center gap-1">
              <DollarSign size={11} style={{ color: "var(--muted-foreground)" }} />
              <span className="text-xs font-bold">{fmt(deal.askPrice)}</span>
            </div>
          ) : (
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>No price</span>
          )}

          {spread !== null && (
            <div className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{
                background: spread > 0 ? "var(--invicta-green)20" : "var(--invicta-red)20",
                color: spread > 0 ? "var(--invicta-green)" : "var(--invicta-red)",
              }}>
              <TrendingUp size={10} />
              <span className="text-xs font-bold">
                {spread > 0 ? "+" : ""}{fmt(spread)}
              </span>
            </div>
          )}

          <ArrowUpRight size={12} className="ml-auto opacity-0 group-hover:opacity-50 transition-opacity"
            style={{ color: "var(--muted-foreground)" }} />
        </div>
      </div>
    </Link>
  );
}

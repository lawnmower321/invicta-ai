"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Plus, MapPin, DollarSign, User, ArrowUpRight,
  TrendingUp, X, RotateCcw, Loader2, Inbox,
} from "lucide-react";

const supabase = createClient();

const STAGES = [
  { id: "new",       label: "New Lead",         color: "var(--invicta-blue)",   bg: "var(--invicta-blue)18" },
  { id: "contacted", label: "Contacted",         color: "var(--invicta-amber)",  bg: "var(--invicta-amber)18" },
  { id: "qualified", label: "Qualified",         color: "var(--invicta-purple)", bg: "var(--invicta-purple)18" },
  { id: "offer",     label: "Offer Made",        color: "var(--invicta-green)",  bg: "var(--invicta-green)18" },
  { id: "contract",  label: "Under Contract",    color: "var(--invicta-green)",  bg: "var(--invicta-green)25" },
  { id: "closed",    label: "Closed / Assigned", color: "var(--invicta-red)",    bg: "var(--invicta-red)18" },
];

type Lead = {
  id: string;
  address: string;
  owner_name: string | null;
  phone: string | null;
  ask_price: number | null;
  arv: number | null;
  repair_est: number | null;
  source: string;
  stage: string;
  assigned_to: string | null;
  assigned_at: string | null;
  notes: string | null;
  profiles?: { display_name: string } | null;
};

const EMPTY_FORM = { address: "", owner_name: "", ask_price: "", arv: "", phone: "", source: "Manual" };

function fmt(n: number) { return "$" + n.toLocaleString(); }

export default function PipelinePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [overPool, setOverPool] = useState(false);
  const dragSource = useRef<"pool" | "kanban">("pool");
  const dragId = useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    fetchLeads();

    const channel = supabase
      .channel("leads-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, fetchLeads)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchLeads() {
    const { data } = await supabase
      .from("leads")
      .select("*, profiles(display_name)")
      .order("created_at", { ascending: false });
    setLeads(data ?? []);
    setLoading(false);
  }

  async function claimLead(leadId: string, stage: string) {
    await supabase.from("leads").update({
      assigned_to: userId,
      assigned_at: new Date().toISOString(),
      stage,
    }).eq("id", leadId);

    await supabase.from("lead_activity").insert({
      lead_id: leadId,
      user_id: userId,
      action: "claimed",
      details: `Claimed and moved to ${stage}`,
    });
  }

  async function releaseLead(leadId: string) {
    await supabase.from("leads").update({
      assigned_to: null,
      assigned_at: null,
      stage: "new",
    }).eq("id", leadId);

    await supabase.from("lead_activity").insert({
      lead_id: leadId,
      user_id: userId,
      action: "released",
      details: "Returned to pool",
    });
  }

  async function updateStage(leadId: string, stage: string) {
    await supabase.from("leads").update({ stage }).eq("id", leadId);
    await supabase.from("lead_activity").insert({
      lead_id: leadId,
      user_id: userId,
      action: "stage_changed",
      details: stage,
    });
  }

  async function addLead() {
    if (!form.address.trim()) return;
    setSaving(true);
    await supabase.from("leads").insert({
      address: form.address.trim(),
      owner_name: form.owner_name.trim() || null,
      phone: form.phone.trim() || null,
      ask_price: form.ask_price ? Number(form.ask_price.replace(/\D/g, "")) : null,
      arv: form.arv ? Number(form.arv.replace(/\D/g, "")) : null,
      source: form.source,
      stage: "new",
      assigned_to: null,
    });
    setForm(EMPTY_FORM);
    setShowModal(false);
    setSaving(false);
  }

  // drag handlers
  function onDragStart(id: string, source: "pool" | "kanban") {
    dragId.current = id;
    dragSource.current = source;
    setDragging(id);
  }

  function onDragEnd() {
    setDragging(null);
    setOverCol(null);
    setOverPool(false);
  }

  async function onDropKanban(stageId: string) {
    if (!dragId.current) return;
    if (dragSource.current === "pool") {
      await claimLead(dragId.current, stageId);
    } else {
      await updateStage(dragId.current, stageId);
    }
    setDragging(null);
    setOverCol(null);
    dragId.current = null;
  }

  async function onDropPool() {
    if (!dragId.current || dragSource.current !== "kanban") return;
    await releaseLead(dragId.current);
    setDragging(null);
    setOverPool(false);
    dragId.current = null;
  }

  const pool = leads.filter(l => !l.assigned_to);
  const mine = leads.filter(l => l.assigned_to === userId);
  const totalValue = mine.filter(l => l.ask_price).reduce((s, l) => s + (l.ask_price ?? 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--invicta-green)" }} />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Pool Panel ── */}
      <div
        className="flex flex-col border-r flex-shrink-0 transition-all"
        style={{
          width: 280,
          background: overPool ? "var(--invicta-blue)08" : "var(--surface)",
          borderColor: overPool ? "var(--invicta-blue)" : "var(--border)",
        }}
        onDragOver={e => { e.preventDefault(); setOverPool(true); }}
        onDragLeave={() => setOverPool(false)}
        onDrop={onDropPool}
      >
        {/* pool header */}
        <div className="px-4 pt-6 pb-4 border-b flex-shrink-0" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Inbox size={15} style={{ color: "var(--invicta-blue)" }} />
              <span className="font-bold text-sm tracking-wide">Lead Pool</span>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: "var(--invicta-blue)20", color: "var(--invicta-blue)" }}>
              {pool.length}
            </span>
          </div>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Drag a lead into your pipeline to claim it
          </p>
          <button onClick={() => setShowModal(true)}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-xs transition-all hover:opacity-90"
            style={{ background: "var(--invicta-blue)20", color: "var(--invicta-blue)", border: "1px dashed var(--invicta-blue)50" }}>
            <Plus size={13} />
            Add to Pool
          </button>
        </div>

        {/* pool cards */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {pool.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-2"
              style={{ color: "var(--muted-foreground)" }}>
              <Inbox size={24} className="opacity-30" />
              <p className="text-xs text-center">Pool is empty — add leads or run the scraper</p>
            </div>
          )}
          {pool.map(lead => (
            <div
              key={lead.id}
              draggable
              onDragStart={() => onDragStart(lead.id, "pool")}
              onDragEnd={onDragEnd}
              className="rounded-xl border p-3 cursor-grab active:cursor-grabbing transition-all"
              style={{
                background: "var(--surface-2)",
                borderColor: dragging === lead.id ? "var(--invicta-blue)" : "var(--border)",
                opacity: dragging === lead.id ? 0.4 : 1,
                borderLeftWidth: 3,
                borderLeftColor: "var(--invicta-blue)",
              }}>
              <div className="flex items-start gap-1.5 mb-1.5">
                <MapPin size={11} className="flex-shrink-0 mt-0.5" style={{ color: "var(--invicta-blue)" }} />
                <p className="text-xs font-bold leading-snug">{lead.address}</p>
              </div>
              {lead.owner_name && (
                <div className="flex items-center gap-1 mb-1.5">
                  <User size={9} style={{ color: "var(--muted-foreground)" }} />
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{lead.owner_name}</p>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs px-1.5 py-0.5 rounded font-bold"
                  style={{ background: "var(--surface-3)", color: "var(--muted-foreground)" }}>
                  {lead.source}
                </span>
                {lead.ask_price && (
                  <span className="text-xs font-bold" style={{ color: "var(--invicta-amber)" }}>
                    {fmt(lead.ask_price)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {overPool && dragSource.current === "kanban" && (
          <div className="px-3 py-2 text-xs font-bold text-center border-t flex-shrink-0"
            style={{ color: "var(--invicta-blue)", borderColor: "var(--invicta-blue)" }}>
            Drop to release back to pool
          </div>
        )}
      </div>

      {/* ── My Pipeline Kanban ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between flex-shrink-0 border-b"
          style={{ borderColor: "var(--border)" }}>
          <div>
            <h1 className="text-xl font-bold tracking-wide">My Pipeline</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              {mine.length} leads · {totalValue > 0 ? fmt(totalValue) + " ask value" : "no value yet"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {STAGES.map(s => {
              const count = mine.filter(l => l.stage === s.id).length;
              return (
                <div key={s.id} className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                  <span className="text-xs font-bold" style={{ color: count > 0 ? s.color : "var(--muted-foreground)" }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* kanban columns */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
          <div className="flex gap-3 h-full" style={{ minWidth: `${STAGES.length * 260}px` }}>
            {STAGES.map(stage => {
              const stageLeads = mine.filter(l => l.stage === stage.id);
              const isOver = overCol === stage.id;

              return (
                <div
                  key={stage.id}
                  className="flex flex-col flex-shrink-0 rounded-2xl border transition-all"
                  style={{
                    width: 248,
                    background: isOver ? stage.bg : "var(--surface)",
                    borderColor: isOver ? stage.color : "var(--border)",
                  }}
                  onDragOver={e => { e.preventDefault(); setOverCol(stage.id); }}
                  onDragLeave={() => setOverCol(null)}
                  onDrop={() => onDropKanban(stage.id)}
                >
                  {/* column header */}
                  <div className="px-3 pt-3 pb-2.5 flex items-center justify-between flex-shrink-0 border-b"
                    style={{ borderColor: "var(--border)" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                      <span className="text-xs font-bold tracking-wide">{stage.label}</span>
                    </div>
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: stage.bg, color: stage.color }}>
                      {stageLeads.length}
                    </span>
                  </div>

                  {/* cards */}
                  <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
                    {stageLeads.length === 0 && (
                      <div className="flex-1 flex items-center justify-center rounded-xl border border-dashed"
                        style={{ borderColor: "var(--border)", minHeight: 60 }}>
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          {isOver ? "Drop here" : "Empty"}
                        </p>
                      </div>
                    )}
                    {stageLeads.map(lead => {
                      const mao = lead.arv && lead.repair_est ? Math.round(lead.arv * 0.7 - lead.repair_est) : null;
                      const spread = mao && lead.ask_price ? mao - lead.ask_price : null;

                      return (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={() => onDragStart(lead.id, "kanban")}
                          onDragEnd={onDragEnd}
                          className="rounded-xl border p-3 cursor-grab active:cursor-grabbing transition-all group"
                          style={{
                            background: "var(--surface-2)",
                            borderColor: dragging === lead.id ? stage.color : "var(--border)",
                            opacity: dragging === lead.id ? 0.4 : 1,
                            borderLeftWidth: 3,
                            borderLeftColor: stage.color,
                          }}>
                          <div className="flex items-start gap-1.5 mb-1.5">
                            <MapPin size={11} className="flex-shrink-0 mt-0.5" style={{ color: stage.color }} />
                            <p className="text-xs font-bold leading-snug">{lead.address}</p>
                          </div>
                          {lead.owner_name && (
                            <p className="text-xs mb-1.5 pl-4" style={{ color: "var(--muted-foreground)" }}>
                              {lead.owner_name}
                            </p>
                          )}
                          <div className="flex items-center justify-between pt-2 border-t"
                            style={{ borderColor: "var(--border)" }}>
                            {lead.ask_price
                              ? <span className="text-xs font-bold">{fmt(lead.ask_price)}</span>
                              : <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>No price</span>}
                            {spread !== null && (
                              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                                style={{
                                  background: spread > 0 ? "var(--invicta-green)20" : "var(--invicta-red)20",
                                  color: spread > 0 ? "var(--invicta-green)" : "var(--invicta-red)",
                                }}>
                                {spread > 0 ? "+" : ""}{fmt(spread)}
                              </span>
                            )}
                          </div>
                          {/* release button */}
                          <button
                            onClick={() => releaseLead(lead.id)}
                            className="mt-2 w-full flex items-center justify-center gap-1 py-1 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: "var(--surface-3)", color: "var(--muted-foreground)" }}>
                            <RotateCcw size={10} />
                            Release
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Lead Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="w-full max-w-md rounded-2xl border p-6"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Add Lead to Pool</h2>
              <button onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-60"
                style={{ background: "var(--surface-3)" }}>
                <X size={14} />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { key: "address",    label: "Property Address *", placeholder: "123 Main St, White Plains NY" },
                { key: "owner_name", label: "Owner Name",         placeholder: "John Smith" },
                { key: "phone",      label: "Phone",              placeholder: "(914) 555-0000" },
                { key: "ask_price",  label: "Ask Price",          placeholder: "$175,000" },
                { key: "arv",        label: "Est. ARV",           placeholder: "$290,000" },
              ].map(({ key, label, placeholder }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold tracking-wider uppercase"
                    style={{ color: "var(--muted-foreground)" }}>{label}</label>
                  <input
                    type="text"
                    value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    autoFocus={key === "address"}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "inherit" }}
                    onFocus={e => (e.target.style.borderColor = "var(--invicta-blue)")}
                    onBlur={e => (e.target.style.borderColor = "var(--border)")}
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold tracking-wider uppercase"
                  style={{ color: "var(--muted-foreground)" }}>Source</label>
                <div className="flex gap-2 flex-wrap">
                  {["Manual", "Cold Call", "Scraper", "Referral", "Direct Mail"].map(s => (
                    <button key={s} onClick={() => setForm(f => ({ ...f, source: s }))}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: form.source === s ? "var(--invicta-blue)20" : "var(--surface-3)",
                        color: form.source === s ? "var(--invicta-blue)" : "var(--muted-foreground)",
                        border: form.source === s ? "1px solid var(--invicta-blue)" : "1px solid var(--border)",
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: "var(--surface-3)", color: "var(--muted-foreground)" }}>
                Cancel
              </button>
              <button onClick={addLead} disabled={saving}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                style={{ background: "var(--invicta-blue)", color: "#fff" }}>
                {saving && <Loader2 size={14} className="animate-spin" />}
                Add to Pool
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

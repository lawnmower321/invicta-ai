"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  Plus, X, Loader2, ExternalLink,
  Pencil, Check, Trash2, AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LeadCard,
  KpiCard, KpiGrid,
  SectionHeader, EmptyLeads, EmptyPipeline,
  StatBadge, Spinner,
  accent as accentToken,
  type AccentColor, type Lead as InvictaLead, type PipelineStage,
} from "@/components/invicta";
import { STAGE_ACCENT } from "@/components/invicta/presets.constants";
import { fadeUp, quickTransition } from "@/lib/animations";

const supabase = createClient();

type StageDef = { id: PipelineStage; label: string };

const STAGES: StageDef[] = [
  { id: "new",       label: "New Lead" },
  { id: "contacted", label: "Contacted" },
  { id: "qualified", label: "Qualified" },
  { id: "offer",     label: "Offer Made" },
  { id: "contract",  label: "Under Contract" },
  { id: "closed",    label: "Closed" },
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
const SOURCES = ["Manual", "Cold Call", "Scraper", "Referral", "Direct Mail"];

function fmt(n: number) { return "$" + n.toLocaleString(); }

// LeadCard's stage is typed as PipelineStage; DB returns string. Cast at boundary.
function toInvictaLead(l: Lead): InvictaLead {
  return {
    id: l.id,
    address: l.address,
    owner_name: l.owner_name,
    phone: l.phone,
    ask_price: l.ask_price,
    arv: l.arv,
    repair_est: l.repair_est,
    source: l.source,
    stage: l.stage as PipelineStage,
  };
}

export default function PipelinePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [quickLead, setQuickLead] = useState<Lead | null>(null);
  const [poolEditMode, setPoolEditMode] = useState(false);
  const [pendingDeletes, setPendingDeletes] = useState<Map<string, { lead: Lead; timerId: ReturnType<typeof setTimeout> }>>(new Map());
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [dragging, setDragging] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [overPool, setOverPool] = useState(false);
  const dragSource = useRef<"pool" | "kanban">("pool");
  const dragId = useRef<string | null>(null);
  const [mobileTab, setMobileTab] = useState<string>("pool");

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
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error("fetchLeads error:", error.message, error.code);
    setLeads(data ?? []);
    setLoading(false);
  }

  function deletePoolLead(lead: Lead) {
    const timerId = setTimeout(async () => {
      await supabase.from("leads").delete().eq("id", lead.id);
      setPendingDeletes(prev => { const n = new Map(prev); n.delete(lead.id); return n; });
    }, 5000);
    setPendingDeletes(prev => new Map(prev).set(lead.id, { lead, timerId }));
  }

  function undoDelete(leadId: string) {
    const entry = pendingDeletes.get(leadId);
    if (!entry) return;
    clearTimeout(entry.timerId);
    setPendingDeletes(prev => { const n = new Map(prev); n.delete(leadId); return n; });
  }

  async function claimLead(leadId: string, stage: string) {
    await supabase.from("leads").update({
      assigned_to: userId,
      assigned_at: new Date().toISOString(),
      stage,
    }).eq("id", leadId);
    await supabase.from("lead_activity").insert({
      lead_id: leadId, user_id: userId, action: "claimed",
      details: `Claimed and moved to ${stage}`,
    });
  }

  async function releaseLead(leadId: string) {
    await supabase.from("leads").update({
      assigned_to: null, assigned_at: null, stage: "new",
    }).eq("id", leadId);
    await supabase.from("lead_activity").insert({
      lead_id: leadId, user_id: userId, action: "released",
      details: "Returned to pool",
    });
  }

  async function updateStage(leadId: string, stage: string) {
    await supabase.from("leads").update({ stage }).eq("id", leadId);
    await supabase.from("lead_activity").insert({
      lead_id: leadId, user_id: userId, action: "stage_changed", details: stage,
    });
  }

  async function addLead() {
    if (!form.address.trim()) return;
    setSaving(true);
    setSaveError("");
    const { error } = await supabase.from("leads").insert({
      address: form.address.trim(),
      owner_name: form.owner_name.trim() || null,
      phone: form.phone.trim() || null,
      ask_price: form.ask_price ? Number(form.ask_price.replace(/\D/g, "")) : null,
      arv: form.arv ? Number(form.arv.replace(/\D/g, "")) : null,
      source: form.source,
      stage: "new",
      assigned_to: null,
    });
    setSaving(false);
    if (error) { setSaveError(error.message); return; }
    await fetchLeads();
    setForm(EMPTY_FORM);
    setShowModal(false);
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
    dragId.current = null;
  }
  async function onDropKanban(stageId: string) {
    if (!dragId.current) return;
    if (dragSource.current === "pool") await claimLead(dragId.current, stageId);
    else await updateStage(dragId.current, stageId);
    onDragEnd();
  }
  async function onDropPool() {
    if (!dragId.current || dragSource.current !== "kanban") return;
    await releaseLead(dragId.current);
    onDragEnd();
  }

  function handleKanbanAction(action: "claim" | "release" | "delete" | "add", id: string) {
    if (action === "release") releaseLead(id);
  }

  const pool = leads.filter(l => !l.assigned_to);
  const mine = leads.filter(l => l.assigned_to === userId);
  const totalValue = mine.filter(l => l.ask_price).reduce((s, l) => s + (l.ask_price ?? 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div
      className="fixed top-14 md:top-0 bottom-[72px] md:bottom-0 left-0 md:left-[220px] right-0 flex flex-col overflow-hidden"
      style={{
        background: "var(--background)",
        ["--page-accent" as string]: "var(--invicta-green)",
      } as React.CSSProperties}
    >
      {/* Ambient page-accent glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-48 -right-24 w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{ background: "var(--page-accent)", opacity: 0.06 }}
        />
        <div
          className="absolute -bottom-48 -left-24 w-[400px] h-[400px] rounded-full blur-[120px]"
          style={{ background: "var(--page-accent)", opacity: 0.04 }}
        />
      </div>

      {/* ── MOBILE ─────────────────────────────────────────── */}
      <MobileView
        mobileTab={mobileTab}
        setMobileTab={setMobileTab}
        pool={pool}
        mine={mine}
        pendingDeletes={pendingDeletes}
        poolEditMode={poolEditMode}
        setPoolEditMode={setPoolEditMode}
        deletePoolLead={deletePoolLead}
        undoDelete={undoDelete}
        openAdd={() => { setSaveError(""); setShowModal(true); }}
        openQuick={setQuickLead}
        onCardClick={(id) => router.push(`/leads/${id}`)}
      />

      {/* ── DESKTOP ────────────────────────────────────────── */}
      <div className="hidden md:flex flex-1 relative z-10 overflow-hidden">
        <PoolPanel
          pool={pool}
          pendingDeletes={pendingDeletes}
          poolEditMode={poolEditMode}
          setPoolEditMode={setPoolEditMode}
          openAdd={() => { setSaveError(""); setShowModal(true); }}
          openQuick={setQuickLead}
          deletePoolLead={deletePoolLead}
          undoDelete={undoDelete}
          dragging={dragging}
          dragSourceIsKanban={dragSource.current === "kanban"}
          overPool={overPool}
          onDragOverPool={(over) => setOverPool(over)}
          onDropPool={onDropPool}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div
            className="px-6 pt-5 pb-4 flex items-center justify-between flex-shrink-0 border-b"
            style={{ borderColor: "rgb(255 255 255 / 0.06)" }}
          >
            <div>
              <div className="text-[10px] tracking-[0.18em] opacity-60 uppercase font-bold mb-0.5">
                Pipeline
              </div>
              <h1 className="font-bold text-xl md:text-2xl">My Deals</h1>
              <p className="text-xs mt-0.5 text-muted-foreground">
                {mine.length} leads
                {totalValue > 0 && <> · {fmt(totalValue)} ask value</>}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {STAGES.map(s => {
                const count = mine.filter(l => l.stage === s.id).length;
                return (
                  <StatBadge
                    key={s.id}
                    label={`${count}`}
                    accent={count > 0 ? STAGE_ACCENT[s.id] : "neutral"}
                    size="xs"
                    variant={count > 0 ? "soft" : "outline"}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
            <div className="flex gap-3 h-full" style={{ minWidth: `${STAGES.length * 260}px` }}>
              {STAGES.map(stage => {
                const stageLeads = mine.filter(l => l.stage === stage.id);
                const isOver = overCol === stage.id;
                const tok = accentToken(STAGE_ACCENT[stage.id]);
                return (
                  <div
                    key={stage.id}
                    data-glass
                    className="flex flex-col flex-shrink-0 rounded-2xl border border-white/[0.08] transition-colors"
                    style={{
                      width: 248,
                      background: isOver ? tok.soft : "var(--surface-glass)",
                      borderColor: isOver ? tok.border : undefined,
                    }}
                    onDragOver={e => { e.preventDefault(); setOverCol(stage.id); }}
                    onDragLeave={() => setOverCol(null)}
                    onDrop={() => onDropKanban(stage.id)}
                  >
                    <div className="px-3 pt-3 pb-2.5 flex-shrink-0">
                      <SectionHeader
                        title={stage.label}
                        accent={STAGE_ACCENT[stage.id]}
                        count={stageLeads.length}
                        size="sm"
                      />
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
                      {stageLeads.length === 0 ? (
                        <div className="flex-1 min-h-[80px] flex items-stretch">
                          <div className="flex-1">
                            <EmptyPipeline stage={stage.id} />
                          </div>
                        </div>
                      ) : (
                        stageLeads.map(lead => (
                          <div
                            key={lead.id}
                            draggable
                            onDragStart={() => onDragStart(lead.id, "kanban")}
                            onDragEnd={onDragEnd}
                          >
                            <LeadCard
                              variant="kanban"
                              lead={toInvictaLead(lead)}
                              dragging={dragging === lead.id}
                              onClick={(id) => router.push(`/leads/${id}`)}
                              onAction={handleKanbanAction}
                              showActions
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {quickLead && (
          <QuickLeadSheet
            lead={quickLead}
            onClose={() => setQuickLead(null)}
            onClaim={async () => { await claimLead(quickLead.id, "new"); setQuickLead(null); }}
            onView={() => { router.push(`/leads/${quickLead.id}`); setQuickLead(null); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && (
          <AddLeadModal
            form={form}
            setForm={setForm}
            saving={saving}
            saveError={saveError}
            onClose={() => setShowModal(false)}
            onSubmit={addLead}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Mobile
// ────────────────────────────────────────────────────────────

type MobileViewProps = {
  mobileTab: string;
  setMobileTab: (id: string) => void;
  pool: Lead[];
  mine: Lead[];
  pendingDeletes: Map<string, { lead: Lead }>;
  poolEditMode: boolean;
  setPoolEditMode: (v: boolean | ((prev: boolean) => boolean)) => void;
  deletePoolLead: (l: Lead) => void;
  undoDelete: (id: string) => void;
  openAdd: () => void;
  openQuick: (l: Lead) => void;
  onCardClick: (id: string) => void;
};

function MobileView(props: MobileViewProps) {
  const {
    mobileTab, setMobileTab, pool, mine, pendingDeletes,
    poolEditMode, setPoolEditMode, deletePoolLead, undoDelete,
    openAdd, openQuick, onCardClick,
  } = props;

  const TABS = [
    { id: "pool", label: "Pool", count: pool.length, accent: "blue" as AccentColor },
    ...STAGES.map(s => ({
      id: s.id, label: s.label,
      count: mine.filter(l => l.stage === s.id).length,
      accent: STAGE_ACCENT[s.id],
    })),
  ];

  return (
    <div className="flex flex-col flex-1 md:hidden relative z-10 overflow-hidden">
      <div
        className="flex overflow-x-auto border-b flex-shrink-0 px-2 py-2 gap-1"
        style={{ borderColor: "rgb(255 255 255 / 0.06)", scrollbarWidth: "none" }}
      >
        {TABS.map(tab => {
          const active = mobileTab === tab.id;
          const tok = accentToken(tab.accent);
          return (
            <button
              key={tab.id}
              onClick={() => setMobileTab(tab.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
              style={{
                background: active ? tok.soft : "transparent",
                color: active ? tok.fg : "var(--muted-foreground)",
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <StatBadge label={`${tab.count}`} accent={tab.accent} size="xs" />
              )}
            </button>
          );
        })}
      </div>

      {mobileTab === "pool" && (
        <div className="px-4 py-2.5 flex-shrink-0">
          <SectionHeader
            title="Lead Pool"
            count={pool.length}
            accent="blue"
            hint={poolEditMode ? "Tap trash to remove" : "Tap to claim or view"}
            action={
              <>
                <button
                  onClick={() => setPoolEditMode(e => !e)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold"
                  style={{
                    background: poolEditMode ? accentToken("red").soft : "var(--surface-3)",
                    color: poolEditMode ? accentToken("red").fg : "var(--muted-foreground)",
                  }}
                >
                  {poolEditMode ? <><Check size={11} />Done</> : <><Pencil size={11} />Edit</>}
                </button>
                {!poolEditMode && (
                  <button
                    onClick={openAdd}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold"
                    style={{ background: accentToken("blue").soft, color: accentToken("blue").fg }}
                  >
                    <Plus size={11} /> Add
                  </button>
                )}
              </>
            }
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-2">
        {mobileTab === "pool" ? (
          pool.length === 0 && pendingDeletes.size === 0 ? (
            <EmptyLeads onAdd={openAdd} />
          ) : (
            <>
              {Array.from(pendingDeletes.values()).map(({ lead }) => (
                <UndoRow key={lead.id} lead={lead} onUndo={() => undoDelete(lead.id)} />
              ))}
              {pool.filter(l => !pendingDeletes.has(l.id)).map(lead => (
                <PoolCardWithEdit
                  key={lead.id}
                  lead={lead}
                  editMode={poolEditMode}
                  onDelete={() => deletePoolLead(lead)}
                  onClick={() => !poolEditMode && openQuick(lead)}
                />
              ))}
            </>
          )
        ) : (() => {
          const stage = STAGES.find(s => s.id === mobileTab);
          if (!stage) return null;
          const stageLeads = mine.filter(l => l.stage === mobileTab);
          if (stageLeads.length === 0) {
            return (
              <div className="pt-8">
                <EmptyPipeline stage={stage.id} />
              </div>
            );
          }
          return stageLeads.map(lead => (
            <LeadCard
              key={lead.id}
              variant="kanban"
              lead={toInvictaLead(lead)}
              onClick={onCardClick}
            />
          ));
        })()}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Pool panel (desktop)
// ────────────────────────────────────────────────────────────

type PoolPanelProps = {
  pool: Lead[];
  pendingDeletes: Map<string, { lead: Lead }>;
  poolEditMode: boolean;
  setPoolEditMode: (v: boolean | ((prev: boolean) => boolean)) => void;
  openAdd: () => void;
  openQuick: (l: Lead) => void;
  deletePoolLead: (l: Lead) => void;
  undoDelete: (id: string) => void;
  dragging: string | null;
  dragSourceIsKanban: boolean;
  overPool: boolean;
  onDragOverPool: (over: boolean) => void;
  onDropPool: () => void;
  onDragStart: (id: string, source: "pool" | "kanban") => void;
  onDragEnd: () => void;
};

function PoolPanel(props: PoolPanelProps) {
  const blue = accentToken("blue");
  const red = accentToken("red");
  return (
    <div
      className="flex flex-col border-r flex-shrink-0 transition-colors"
      style={{
        width: 280,
        background: props.overPool ? blue.soft : "var(--surface)",
        borderColor: props.overPool ? blue.border : "rgb(255 255 255 / 0.06)",
      }}
      onDragOver={e => { e.preventDefault(); props.onDragOverPool(true); }}
      onDragLeave={() => props.onDragOverPool(false)}
      onDrop={props.onDropPool}
    >
      <div className="px-4 pt-5 pb-4 flex-shrink-0 border-b" style={{ borderColor: "rgb(255 255 255 / 0.06)" }}>
        <SectionHeader
          title="Lead Pool"
          count={props.pool.length}
          accent="blue"
          hint={props.poolEditMode ? "Tap trash to remove" : "Drag to claim · click to preview"}
          divider={false}
          action={
            <button
              onClick={() => props.setPoolEditMode(e => !e)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold"
              style={{
                background: props.poolEditMode ? red.soft : "var(--surface-3)",
                color: props.poolEditMode ? red.fg : "var(--muted-foreground)",
              }}
            >
              {props.poolEditMode ? <><Check size={11} />Done</> : <><Pencil size={11} />Edit</>}
            </button>
          }
        />
        {!props.poolEditMode && (
          <button
            onClick={props.openAdd}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-xs hover:opacity-90"
            style={{ background: blue.soft, color: blue.fg, border: `1px dashed ${blue.border}` }}
          >
            <Plus size={13} /> Add to Pool
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {props.pool.length === 0 && props.pendingDeletes.size === 0 ? (
          <EmptyLeads onAdd={props.openAdd} />
        ) : (
          <>
            {Array.from(props.pendingDeletes.values()).map(({ lead }) => (
              <UndoRow key={lead.id} lead={lead} onUndo={() => props.undoDelete(lead.id)} />
            ))}
            {props.pool.filter(l => !props.pendingDeletes.has(l.id)).map(lead => (
              <div
                key={lead.id}
                draggable={!props.poolEditMode}
                onDragStart={() => !props.poolEditMode && props.onDragStart(lead.id, "pool")}
                onDragEnd={props.onDragEnd}
                className="relative"
              >
                <LeadCard
                  variant="pool"
                  lead={toInvictaLead(lead)}
                  dragging={props.dragging === lead.id}
                  onClick={() => !props.poolEditMode && props.openQuick(lead)}
                  stageColor={props.poolEditMode ? "red" : "blue"}
                />
                {props.poolEditMode && (
                  <button
                    onClick={(e) => { e.stopPropagation(); props.deletePoolLead(lead); }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center hover:opacity-70"
                    style={{ background: red.soft }}
                    aria-label="Delete lead"
                  >
                    <Trash2 size={11} style={{ color: red.fg }} />
                  </button>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {props.overPool && props.dragSourceIsKanban && (
        <div
          className="px-3 py-2 text-xs font-bold text-center border-t flex-shrink-0"
          style={{ color: blue.fg, borderColor: blue.border }}
        >
          Drop to release to pool
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Mobile pool card with absolute edit-mode delete affordance
// ────────────────────────────────────────────────────────────

function PoolCardWithEdit({
  lead, editMode, onDelete, onClick,
}: {
  lead: Lead;
  editMode: boolean;
  onDelete: () => void;
  onClick: () => void;
}) {
  const red = accentToken("red");
  return (
    <div className="relative">
      <LeadCard
        variant="pool"
        lead={toInvictaLead(lead)}
        onClick={onClick}
        stageColor={editMode ? "red" : "blue"}
      />
      {editMode && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70"
          style={{ background: red.soft }}
          aria-label="Delete lead"
        >
          <Trash2 size={13} style={{ color: red.fg }} />
        </button>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Pending-delete undo row
// ────────────────────────────────────────────────────────────

function UndoRow({ lead, onUndo }: { lead: Lead; onUndo: () => void }) {
  const red = accentToken("red");
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="rounded-xl border p-3 flex items-center justify-between gap-2"
      style={{ background: red.soft, borderColor: red.border }}
    >
      <p className="text-xs truncate flex-1 text-muted-foreground">
        Deleting — {lead.address.split(",")[0]}
      </p>
      <button
        onClick={onUndo}
        className="text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0"
        style={{ background: red.soft, color: red.fg }}
      >
        Undo
      </button>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────
// Quick Lead Sheet
// ────────────────────────────────────────────────────────────

function QuickLeadSheet({
  lead, onClose, onClaim, onView,
}: {
  lead: Lead;
  onClose: () => void;
  onClaim: () => void;
  onView: () => void;
}) {
  const green = accentToken("green");
  const mao = lead.arv && lead.repair_est
    ? Math.round(lead.arv * 0.7 - lead.repair_est)
    : null;
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={quickTransition}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        data-glass
        className="w-full md:max-w-md rounded-t-2xl md:rounded-2xl border border-white/[0.08] p-5 flex flex-col gap-4"
        style={{ background: "var(--surface-glass)" }}
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <SectionHeader
          title={lead.address}
          eyebrow={lead.source}
          divider={false}
          action={
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--surface-3)" }}
              aria-label="Close"
            >
              <X size={14} />
            </button>
          }
        />

        <KpiGrid cols={2}>
          <KpiCard label="Ask"   value={lead.ask_price ?? 0}            format={lead.ask_price ? "currency" : "raw"} accent="amber"  />
          <KpiCard label="ARV"   value={lead.arv ?? 0}                  format={lead.arv ? "currency" : "raw"}        accent="blue"   />
          <KpiCard label="Repair" value={lead.repair_est ?? 0}          format={lead.repair_est ? "currency" : "raw"} accent="red"    />
          <KpiCard label="MAO 70%" value={mao ?? 0}                     format={mao ? "currency" : "raw"}             accent="green"  />
        </KpiGrid>

        {lead.notes && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {lead.notes}
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClaim}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm"
            style={{ background: green.solid, color: "#000" }}
          >
            Claim Lead
          </button>
          <button
            onClick={onView}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm text-muted-foreground"
            style={{ background: "var(--surface-3)" }}
          >
            <ExternalLink size={13} />
            Full Detail
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────
// Add Lead Modal
// ────────────────────────────────────────────────────────────

type AddLeadModalProps = {
  form: typeof EMPTY_FORM;
  setForm: (fn: (f: typeof EMPTY_FORM) => typeof EMPTY_FORM) => void;
  saving: boolean;
  saveError: string;
  onClose: () => void;
  onSubmit: () => void;
};

function AddLeadModal({ form, setForm, saving, saveError, onClose, onSubmit }: AddLeadModalProps) {
  const blue = accentToken("blue");
  const red = accentToken("red");
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={quickTransition}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        data-glass
        className="w-full max-w-md rounded-2xl border border-white/[0.08] p-6"
        style={{ background: "var(--surface-glass)" }}
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 16, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className="mb-5">
          <SectionHeader
            title="Add Lead to Pool"
            accent="blue"
            divider={false}
            action={
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-60"
                style={{ background: "var(--surface-3)" }}
                aria-label="Close"
              >
                <X size={14} />
              </button>
            }
          />
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
              <label className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
                {label}
              </label>
              <input
                type="text"
                value={(form as Record<string, string>)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                autoFocus={key === "address"}
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                style={{
                  background: "var(--surface-2)",
                  borderColor: "rgb(255 255 255 / 0.08)",
                  color: "var(--foreground)",
                  fontFamily: "inherit",
                }}
                onFocus={e => (e.target.style.borderColor = blue.fg)}
                onBlur={e => (e.target.style.borderColor = "rgb(255 255 255 / 0.08)")}
              />
            </div>
          ))}

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
              Source
            </label>
            <div className="flex gap-2 flex-wrap">
              {SOURCES.map(s => {
                const active = form.source === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, source: s }))}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border"
                    style={{
                      background: active ? blue.soft : "var(--surface-3)",
                      color: active ? blue.fg : "var(--muted-foreground)",
                      borderColor: active ? blue.border : "rgb(255 255 255 / 0.06)",
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {saveError && (
          <div
            className="flex items-center gap-2 text-xs mt-4 p-3 rounded-xl"
            style={{ background: red.soft, color: red.fg }}
          >
            <AlertCircle size={13} />{saveError}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-muted-foreground"
            style={{ background: "var(--surface-3)" }}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
            style={{ background: blue.solid, color: "#fff" }}
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Add to Pool
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

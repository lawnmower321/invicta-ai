"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  User, Phone, Mail,
  TrendingUp, Calculator, CheckCircle2, Circle,
  Plus, Pencil, Save, X, Loader2, ChevronDown,
  Megaphone, Copy, Check, Zap,
} from "lucide-react";
import PageShell from "@/components/PageShell";
import {
  KpiCard, KpiGrid, SectionHeader,
  StatBadge, SpreadBadge, Spinner,
  accent as accentToken,
  type AccentColor, type PipelineStage,
} from "@/components/invicta";
import { STAGE_ACCENT } from "@/components/invicta/presets.constants";

const supabase = createClient();

const STAGE_LABELS_FULL: Record<PipelineStage, string> = {
  new: "New Lead",
  contacted: "Contacted",
  qualified: "Qualified",
  offer: "Offer Made",
  contract: "Under Contract",
  closed: "Closed",
};
const STAGES_ORDER: PipelineStage[] = ["new", "contacted", "qualified", "offer", "contract", "closed"];

type Lead = {
  id: string;
  address: string;
  owner_name: string | null;
  phone: string | null;
  email: string | null;
  ask_price: number | null;
  arv: number | null;
  repair_est: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  year_built: number | null;
  source: string;
  stage: string;
  notes: string | null;
  assigned_to: string | null;
};

type Task = { id: string; text: string; done: boolean; due_date?: string };
type Activity = { id: string; action: string; details: string | null; created_at: string; profiles?: { display_name: string } | null };
type Buyer = { id: string; name: string; phone: string | null; min_price: number | null; max_price: number | null };

type Campaign = {
  email?: { subject: string; body: string };
  text?: string;
  facebook?: string;
  instagram?: { caption: string; hashtags: string };
  directMail?: { headline: string; body: string };
};

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [matchedBuyers, setMatchedBuyers] = useState<Buyer[]>([]);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stageOpen, setStageOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [newTask, setNewTask] = useState("");
  const [newNote, setNewNote] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    fetchLead();
    fetchActivity();
    fetchTasks();
    fetchMatchedBuyers();
  }, [leadId]);

  async function fetchLead() {
    const { data } = await supabase.from("leads").select("*").eq("id", leadId).single();
    if (data) { setLead(data); setNoteDraft(data.notes ?? ""); }
    setLoading(false);
  }

  async function fetchActivity() {
    const { data } = await supabase
      .from("lead_activity")
      .select("*, profiles(display_name)")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });
    setActivity(data ?? []);
  }

  async function updateStage(stageId: PipelineStage) {
    await supabase.from("leads").update({ stage: stageId }).eq("id", leadId);
    await supabase.from("lead_activity").insert({
      lead_id: leadId, user_id: userId, action: "stage_changed", details: STAGE_LABELS_FULL[stageId],
    });
    setLead(l => l ? { ...l, stage: stageId } : l);
    fetchActivity();
    setStageOpen(false);
  }

  async function saveNotes() {
    await supabase.from("leads").update({ notes: noteDraft }).eq("id", leadId);
    setLead(l => l ? { ...l, notes: noteDraft } : l);
    setEditingNotes(false);
  }

  async function fetchMatchedBuyers() {
    const { data: l } = await supabase.from("leads").select("ask_price").eq("id", leadId).single();
    if (!l?.ask_price) return;
    const { data } = await supabase
      .from("buyers")
      .select("id, name, phone, min_price, max_price")
      .lte("min_price", l.ask_price)
      .gte("max_price", l.ask_price);
    setMatchedBuyers(data ?? []);
  }

  async function generateCampaign() {
    if (!lead) return;
    setCampaignLoading(true);
    const res = await fetch("/api/buyer-campaign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: lead.address,
        arv: lead.arv,
        repairs: lead.repair_est,
        askingPrice: lead.ask_price,
        assignmentFee: 10000,
        notes: lead.notes,
      }),
    });
    const data = await res.json();
    setCampaign(data);
    setCampaignLoading(false);
  }

  function copyText(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  async function fetchTasks() {
    const { data } = await supabase
      .from("followups")
      .select("id, text, done, due_date")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: true });
    setTasks(data ?? []);
  }

  async function addNote() {
    if (!newNote.trim()) return;
    await supabase.from("lead_activity").insert({
      lead_id: leadId, user_id: userId, action: "note", details: newNote.trim(),
    });
    setNewNote("");
    fetchActivity();
  }

  async function addTask() {
    if (!newTask.trim() || !lead) return;
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase.from("followups").insert({
      text: newTask.trim(),
      lead_id: leadId,
      lead_label: lead.address,
      due_date: today,
      done: false,
      priority: "medium",
      user_id: userId,
    }).select("id, text, done, due_date").single();
    if (data) setTasks(t => [...t, data]);
    setNewTask("");
  }

  async function toggleTask(id: string) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    setTasks(t => t.map(x => x.id === id ? { ...x, done: !x.done } : x));
    await supabase.from("followups").update({ done: !task.done }).eq("id", id);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  if (!lead) {
    return (
      <PageShell title="Lead Not Found" back>
        <p>This lead could not be found.</p>
      </PageShell>
    );
  }

  const stageKey = lead.stage as PipelineStage;
  const stageAccent: AccentColor = STAGE_ACCENT[stageKey] ?? "neutral";
  const stageTok = accentToken(stageAccent);
  const mao = lead.arv && lead.repair_est ? Math.round(lead.arv * 0.7 - lead.repair_est) : null;
  const spread = mao && lead.ask_price ? mao - lead.ask_price : null;

  const fmtDate = (s: string) => new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const stageAction = (
    <div className="relative">
      <button
        type="button"
        onClick={() => setStageOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border font-bold text-sm"
        style={{ background: stageTok.soft, borderColor: stageTok.border, color: stageTok.fg }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: stageTok.solid }} aria-hidden="true" />
        {STAGE_LABELS_FULL[stageKey] ?? lead.stage}
        <ChevronDown
          size={14}
          style={{ transform: stageOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
        />
      </button>
      {stageOpen && (
        <div
          data-glass
          className="absolute right-0 top-full mt-1 z-20 rounded-xl border border-white/[0.08] overflow-hidden"
          style={{ background: "var(--surface-glass)", minWidth: 200 }}
        >
          {STAGES_ORDER.map(sid => {
            const tok = accentToken(STAGE_ACCENT[sid]);
            return (
              <button
                key={sid}
                onClick={() => updateStage(sid)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold text-left hover:bg-white/[0.04]"
                style={{ color: tok.fg }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: tok.solid }} />
                {STAGE_LABELS_FULL[sid]}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <PageShell
      accent={stageAccent}
      title={lead.address}
      subtitle={lead.owner_name ?? lead.source}
      back
      action={stageAction}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* left col */}
        <div className="md:col-span-2 flex flex-col gap-4">

          {/* Deal Numbers */}
          <div
            data-glass
            className="rounded-2xl border border-white/[0.08] p-5"
            style={{ background: "var(--surface-glass)" }}
          >
            <SectionHeader title="Deal Numbers" />
            <KpiGrid cols={4}>
              <KpiCard label="Ask"      value={lead.ask_price  ?? 0} format={lead.ask_price  ? "currency" : "raw"} accent="amber" />
              <KpiCard label="ARV"      value={lead.arv        ?? 0} format={lead.arv        ? "currency" : "raw"} accent="blue"  />
              <KpiCard label="Repair"   value={lead.repair_est ?? 0} format={lead.repair_est ? "currency" : "raw"} accent="red"   />
              <KpiCard label="MAO 70%"  value={mao ?? 0}              format={mao ? "currency" : "raw"}             accent="green" />
            </KpiGrid>
            <div
              className="flex items-center justify-between gap-2 flex-wrap mt-4 pt-3 border-t"
              style={{ borderColor: "rgb(255 255 255 / 0.06)" }}
            >
              {spread !== null && (
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-muted-foreground">Est. Assignment</span>
                  <SpreadBadge value={spread} size="md" />
                </div>
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => router.push(`/comps?address=${encodeURIComponent(lead.address)}&arv=${lead.arv}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-80"
                  style={{ background: accentToken("purple").soft, color: accentToken("purple").fg }}
                >
                  <TrendingUp size={12} /> Run Comps
                </button>
                <button
                  onClick={() => router.push(`/calculator?ask=${lead.ask_price}&arv=${lead.arv}&repair=${lead.repair_est}&leadId=${leadId}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-80"
                  style={{ background: accentToken("green").soft, color: accentToken("green").fg }}
                >
                  <Calculator size={12} /> Calculator
                </button>
              </div>
            </div>
          </div>

          {/* Property Info */}
          {(lead.beds || lead.baths || lead.sqft || lead.year_built) && (
            <div
              data-glass
              className="rounded-2xl border border-white/[0.08] p-5"
              style={{ background: "var(--surface-glass)" }}
            >
              <SectionHeader title="Property Info" />
              <div className="grid grid-cols-4 gap-3 auto-rows-fr">
                {[
                  { label: "Beds",       value: lead.beds },
                  { label: "Baths",      value: lead.baths },
                  { label: "Sq Ft",      value: lead.sqft?.toLocaleString() },
                  { label: "Year Built", value: lead.year_built },
                ].filter(i => i.value != null).map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-xl p-3 text-center border border-white/[0.06]"
                    style={{ background: "var(--surface-2)" }}
                  >
                    <p className="text-xl font-mono tabular-nums font-bold">{value}</p>
                    <p className="text-[10px] mt-0.5 font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div
            data-glass
            className="rounded-2xl border border-white/[0.08] p-5"
            style={{ background: "var(--surface-glass)" }}
          >
            <SectionHeader
              title="Notes"
              action={
                editingNotes ? (
                  <>
                    <button
                      onClick={saveNotes}
                      className="flex items-center gap-1 text-xs font-bold hover:opacity-70"
                      style={{ color: accentToken("green").fg }}
                    >
                      <Save size={12} /> Save
                    </button>
                    <button
                      onClick={() => setEditingNotes(false)}
                      className="flex items-center gap-1 text-xs font-bold hover:opacity-70 text-muted-foreground"
                    >
                      <X size={12} /> Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditingNotes(true)}
                    className="flex items-center gap-1 text-xs font-bold hover:opacity-70 text-muted-foreground"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                )
              }
            />
            {editingNotes ? (
              <textarea
                value={noteDraft}
                onChange={e => setNoteDraft(e.target.value)}
                rows={4}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
                style={{
                  background: "var(--surface-2)",
                  borderColor: accentToken("green").border,
                  color: "var(--foreground)",
                  fontFamily: "inherit",
                }}
              />
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {lead.notes || "No notes yet."}
              </p>
            )}
          </div>

          {/* Buyer Campaign */}
          {(lead.stage === "contract" || lead.stage === "offer") && (
            <div
              data-glass
              className="rounded-2xl border p-5"
              style={{
                background: "var(--surface-glass)",
                borderColor: accentToken("purple").border,
              }}
            >
              <SectionHeader
                title="Buyer Campaign"
                accent="purple"
                action={
                  <button
                    onClick={generateCampaign}
                    disabled={campaignLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                    style={{ background: accentToken("purple").solid, color: "#fff" }}
                  >
                    {campaignLoading ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                    {campaign ? "Regenerate" : "Generate Copy"}
                  </button>
                }
              />
              {!campaign && !campaignLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Megaphone size={13} style={{ color: accentToken("purple").fg }} />
                  Generate platform-specific marketing copy to blast to your buyers list.
                </div>
              )}
              {campaignLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 size={14} className="animate-spin" />AI is writing your campaign...
                </div>
              )}
              {campaign && (
                <div className="flex flex-col gap-3">
                  {[
                    { key: "email",      label: "Email",       text: campaign.email ? `Subject: ${campaign.email.subject}\n\n${campaign.email.body}` : null },
                    { key: "text",       label: "Text",        text: campaign.text },
                    { key: "facebook",   label: "Facebook",    text: campaign.facebook },
                    { key: "instagram",  label: "Instagram",   text: campaign.instagram ? `${campaign.instagram.caption}\n\n${campaign.instagram.hashtags}` : null },
                    { key: "directMail", label: "Direct Mail", text: campaign.directMail ? `${campaign.directMail.headline}\n\n${campaign.directMail.body}` : null },
                  ].filter((p): p is { key: string; label: string; text: string } => !!p.text).map(({ key, label, text }) => (
                    <div
                      key={key}
                      className="rounded-xl p-3 border border-white/[0.06]"
                      style={{ background: "var(--surface-2)" }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">{label}</span>
                        <button
                          onClick={() => copyText(key, text)}
                          className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg"
                          style={{ background: accentToken("purple").soft, color: accentToken("purple").fg }}
                        >
                          {copiedKey === key ? <><Check size={10} />Copied</> : <><Copy size={10} />Copy</>}
                        </button>
                      </div>
                      <p className="text-xs leading-relaxed whitespace-pre-line">{text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* right col */}
        <div className="flex flex-col gap-4">

          {/* Owner Contact */}
          <div
            data-glass
            className="rounded-2xl border border-white/[0.08] p-5"
            style={{ background: "var(--surface-glass)" }}
          >
            <SectionHeader title="Owner Contact" />
            <div className="flex flex-col gap-2">
              {lead.owner_name && (
                <div
                  className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06]"
                  style={{ background: "var(--surface-2)" }}
                >
                  <User size={14} style={{ color: stageTok.fg }} />
                  <span className="text-sm font-bold">{lead.owner_name}</span>
                </div>
              )}
              {lead.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] hover:opacity-70"
                  style={{ background: "var(--surface-2)" }}
                >
                  <Phone size={14} style={{ color: accentToken("green").fg }} />
                  <span className="text-sm">{lead.phone}</span>
                </a>
              )}
              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] hover:opacity-70"
                  style={{ background: "var(--surface-2)" }}
                >
                  <Mail size={14} style={{ color: accentToken("blue").fg }} />
                  <span className="text-sm">{lead.email}</span>
                </a>
              )}
            </div>
          </div>

          {/* Matched Buyers */}
          {matchedBuyers.length > 0 && (
            <div
              data-glass
              className="rounded-2xl border p-5"
              style={{
                background: "var(--surface-glass)",
                borderColor: accentToken("green").border,
              }}
            >
              <SectionHeader
                title="Matching Buyers"
                count={matchedBuyers.length}
                accent="green"
              />
              <div className="flex flex-col gap-2">
                {matchedBuyers.map(b => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-white/[0.06]"
                    style={{ background: "var(--surface-2)" }}
                  >
                    <div>
                      <p className="text-sm font-bold">{b.name}</p>
                      <p className="text-xs text-muted-foreground font-mono tabular-nums">
                        ${b.min_price?.toLocaleString()} – ${b.max_price?.toLocaleString()}
                      </p>
                    </div>
                    {b.phone && (
                      <a href={`tel:${b.phone}`}>
                        <StatBadge label="Call" accent="green" size="sm" icon={Phone} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          <div
            data-glass
            className="rounded-2xl border border-white/[0.08] p-5"
            style={{ background: "var(--surface-glass)" }}
          >
            <SectionHeader title="Follow-up Tasks" count={tasks.length || undefined} />
            <div className="flex flex-col gap-2 mb-3">
              {tasks.length === 0 && (
                <p className="text-xs text-muted-foreground">No tasks yet.</p>
              )}
              {tasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className="flex items-start gap-2.5 text-left hover:opacity-80"
                >
                  {task.done
                    ? <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" style={{ color: accentToken("green").fg }} />
                    : <Circle size={15} className="flex-shrink-0 mt-0.5 text-muted-foreground" />}
                  <span
                    className="text-sm"
                    style={{
                      textDecoration: task.done ? "line-through" : "none",
                      color: task.done ? "var(--muted-foreground)" : "var(--foreground)",
                    }}
                  >
                    {task.text}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addTask()}
                placeholder="Add task..."
                className="flex-1 px-3 py-2 rounded-lg border text-xs outline-none"
                style={{
                  background: "var(--surface-2)",
                  borderColor: "rgb(255 255 255 / 0.08)",
                  color: "var(--foreground)",
                  fontFamily: "inherit",
                }}
              />
              <button
                onClick={addTask}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80"
                style={{ background: accentToken("green").soft }}
                aria-label="Add task"
              >
                <Plus size={13} style={{ color: accentToken("green").fg }} />
              </button>
            </div>
          </div>

          {/* Activity */}
          <div
            data-glass
            className="rounded-2xl border border-white/[0.08] p-5"
            style={{ background: "var(--surface-glass)" }}
          >
            <SectionHeader title="Activity Log" count={activity.length || undefined} />
            <div className="flex flex-col gap-3 mb-3">
              {activity.length === 0 && (
                <p className="text-xs text-muted-foreground">No activity yet.</p>
              )}
              {activity.map((item, i) => (
                <div key={item.id} className="flex gap-2.5">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: stageTok.solid }} />
                    {i < activity.length - 1 && (
                      <div className="flex-1 w-px" style={{ background: "rgb(255 255 255 / 0.08)" }} />
                    )}
                  </div>
                  <div className="pb-2">
                    <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground">
                      {fmtDate(item.created_at)} · {item.profiles?.display_name ?? "you"}
                    </p>
                    <p className="text-sm mt-0.5">{item.details ?? item.action}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addNote()}
                placeholder="Log activity..."
                className="flex-1 px-3 py-2 rounded-lg border text-xs outline-none"
                style={{
                  background: "var(--surface-2)",
                  borderColor: "rgb(255 255 255 / 0.08)",
                  color: "var(--foreground)",
                  fontFamily: "inherit",
                }}
              />
              <button
                onClick={addNote}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80"
                style={{ background: stageTok.soft }}
                aria-label="Log activity"
              >
                <Plus size={13} style={{ color: stageTok.fg }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

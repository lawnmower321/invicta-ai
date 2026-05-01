"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  ArrowLeft, MapPin, User, Phone, Mail, DollarSign,
  TrendingUp, Calculator, CheckCircle2, Circle,
  Plus, Pencil, Save, X, Loader2, ChevronDown,
} from "lucide-react";

const supabase = createClient();

const STAGES = ["New Lead", "Contacted", "Qualified", "Offer Made", "Under Contract", "Closed"];
const STAGE_IDS: Record<string, string> = {
  "New Lead": "new", "Contacted": "contacted", "Qualified": "qualified",
  "Offer Made": "offer", "Under Contract": "contract", "Closed": "closed",
};
const STAGE_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(STAGE_IDS).map(([k, v]) => [v, k])
);
const STAGE_COLORS: Record<string, string> = {
  new: "var(--invicta-blue)", contacted: "var(--invicta-amber)",
  qualified: "var(--invicta-purple)", offer: "var(--invicta-green)",
  contract: "var(--invicta-green)", closed: "var(--invicta-red)",
};

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

type Task = { id: string; text: string; done: boolean };
type Activity = { id: string; action: string; details: string | null; created_at: string; profiles?: { display_name: string } | null };

function fmt(n: number) { return "$" + n.toLocaleString(); }

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
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

  async function updateStage(stageLabel: string) {
    const stageId = STAGE_IDS[stageLabel];
    await supabase.from("leads").update({ stage: stageId }).eq("id", leadId);
    await supabase.from("lead_activity").insert({
      lead_id: leadId, user_id: userId, action: "stage_changed", details: stageLabel,
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

  async function addNote() {
    if (!newNote.trim()) return;
    await supabase.from("lead_activity").insert({
      lead_id: leadId, user_id: userId, action: "note", details: newNote.trim(),
    });
    setNewNote("");
    fetchActivity();
  }

  function addTask() {
    if (!newTask.trim()) return;
    setTasks(t => [...t, { id: Date.now().toString(), text: newTask.trim(), done: false }]);
    setNewTask("");
  }

  function toggleTask(id: string) {
    setTasks(t => t.map(task => task.id === id ? { ...task, done: !task.done } : task));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--invicta-green)" }} />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 mb-4 hover:opacity-60" style={{ color: "var(--muted-foreground)" }}>
          <ArrowLeft size={15} /> Back
        </button>
        <p>Lead not found.</p>
      </div>
    );
  }

  const color = STAGE_COLORS[lead.stage] ?? "var(--invicta-green)";
  const mao = lead.arv && lead.repair_est ? Math.round(lead.arv * 0.7 - lead.repair_est) : null;
  const spread = mao && lead.ask_price ? mao - lead.ask_price : null;

  const fmtDate = (s: string) => new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="p-8 max-w-[1100px]">
      <button onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-bold mb-6 hover:opacity-60 transition-opacity"
        style={{ color: "var(--muted-foreground)" }}>
        <ArrowLeft size={15} /> Back to Pipeline
      </button>

      {/* header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={15} style={{ color }} />
            <h1 className="text-2xl font-bold tracking-wide">{lead.address}</h1>
          </div>
          <div className="flex items-center gap-2">
            {lead.owner_name && (
              <><User size={13} style={{ color: "var(--muted-foreground)" }} />
              <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>{lead.owner_name}</span></>
            )}
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: `${color}20`, color }}>{lead.source}</span>
          </div>
        </div>

        {/* stage selector */}
        <div className="relative">
          <button onClick={() => setStageOpen(o => !o)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-sm"
            style={{ background: `${color}15`, borderColor: color, color }}>
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            {STAGE_LABELS[lead.stage] ?? lead.stage}
            <ChevronDown size={14} style={{ transform: stageOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
          </button>
          {stageOpen && (
            <div className="absolute right-0 top-full mt-1 z-20 rounded-xl border overflow-hidden"
              style={{ background: "var(--card)", borderColor: "var(--border)", minWidth: 180 }}>
              {STAGES.map(s => (
                <button key={s} onClick={() => updateStage(s)}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold text-left hover:opacity-70"
                  style={{ color: STAGE_COLORS[STAGE_IDS[s]] }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: STAGE_COLORS[STAGE_IDS[s]] }} />
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* left col */}
        <div className="col-span-2 flex flex-col gap-4">

          {/* deal numbers */}
          <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h2 className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--muted-foreground)" }}>Deal Numbers</h2>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: "Ask Price",   value: lead.ask_price ? fmt(lead.ask_price) : "—",  color: "var(--invicta-amber)" },
                { label: "Est. ARV",    value: lead.arv ? fmt(lead.arv) : "—",               color: "var(--invicta-blue)" },
                { label: "Repair Est.", value: lead.repair_est ? fmt(lead.repair_est) : "—", color: "var(--invicta-red)" },
                { label: "MAO (70%)",   value: mao ? fmt(mao) : "—",                         color: "var(--invicta-purple)" },
              ].map(({ label, value, color: c }) => (
                <div key={label} className="rounded-xl p-3" style={{ background: "var(--surface-2)" }}>
                  <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>{label}</p>
                  <p className="text-lg font-bold" style={{ color: c }}>{value}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "var(--border)" }}>
              {spread !== null && (
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} style={{ color: spread > 0 ? "var(--invicta-green)" : "var(--invicta-red)" }} />
                  <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>Est. Assignment</span>
                  <span className="text-lg font-bold" style={{ color: spread > 0 ? "var(--invicta-green)" : "var(--invicta-red)" }}>
                    {spread > 0 ? "+" : ""}{fmt(spread)}
                  </span>
                </div>
              )}
              <div className="flex gap-2 ml-auto">
                <button onClick={() => router.push(`/comps?address=${encodeURIComponent(lead.address)}&arv=${lead.arv}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-80"
                  style={{ background: "var(--invicta-purple)20", color: "var(--invicta-purple)" }}>
                  <TrendingUp size={12} /> Run Comps
                </button>
                <button onClick={() => router.push(`/calculator?ask=${lead.ask_price}&arv=${lead.arv}&repair=${lead.repair_est}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-80"
                  style={{ background: "var(--invicta-green)20", color: "var(--invicta-green)" }}>
                  <Calculator size={12} /> Calculator
                </button>
              </div>
            </div>
          </div>

          {/* property info */}
          {(lead.beds || lead.baths || lead.sqft || lead.year_built) && (
            <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <h2 className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--muted-foreground)" }}>Property Info</h2>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Beds",       value: lead.beds },
                  { label: "Baths",      value: lead.baths },
                  { label: "Sq Ft",      value: lead.sqft?.toLocaleString() },
                  { label: "Year Built", value: lead.year_built },
                ].filter(i => i.value).map(({ label, value }) => (
                  <div key={label} className="rounded-xl p-3 text-center" style={{ background: "var(--surface-2)" }}>
                    <p className="text-xl font-bold">{value}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* notes */}
          <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--muted-foreground)" }}>Notes</h2>
              {editingNotes
                ? <div className="flex gap-2">
                    <button onClick={saveNotes} className="flex items-center gap-1 text-xs font-bold hover:opacity-70" style={{ color: "var(--invicta-green)" }}><Save size={12} /> Save</button>
                    <button onClick={() => setEditingNotes(false)} className="flex items-center gap-1 text-xs font-bold hover:opacity-70" style={{ color: "var(--muted-foreground)" }}><X size={12} /> Cancel</button>
                  </div>
                : <button onClick={() => setEditingNotes(true)} className="flex items-center gap-1 text-xs font-bold hover:opacity-70" style={{ color: "var(--muted-foreground)" }}><Pencil size={12} /> Edit</button>}
            </div>
            {editingNotes
              ? <textarea value={noteDraft} onChange={e => setNoteDraft(e.target.value)} rows={4}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
                  style={{ background: "var(--surface-2)", borderColor: "var(--invicta-green)", color: "var(--foreground)", fontFamily: "inherit" }} />
              : <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  {lead.notes || "No notes yet."}
                </p>}
          </div>
        </div>

        {/* right col */}
        <div className="flex flex-col gap-4">

          {/* contact */}
          <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h2 className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--muted-foreground)" }}>Owner Contact</h2>
            <div className="flex flex-col gap-2">
              {lead.owner_name && (
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
                  <User size={14} style={{ color }} /><span className="text-sm font-bold">{lead.owner_name}</span>
                </div>
              )}
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="flex items-center gap-3 p-3 rounded-xl hover:opacity-70" style={{ background: "var(--surface-2)" }}>
                  <Phone size={14} style={{ color: "var(--invicta-green)" }} /><span className="text-sm">{lead.phone}</span>
                </a>
              )}
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="flex items-center gap-3 p-3 rounded-xl hover:opacity-70" style={{ background: "var(--surface-2)" }}>
                  <Mail size={14} style={{ color: "var(--invicta-blue)" }} /><span className="text-sm">{lead.email}</span>
                </a>
              )}
            </div>
          </div>

          {/* tasks */}
          <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h2 className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "var(--muted-foreground)" }}>Follow-up Tasks</h2>
            <div className="flex flex-col gap-2 mb-3">
              {tasks.map(task => (
                <button key={task.id} onClick={() => toggleTask(task.id)} className="flex items-start gap-2.5 text-left hover:opacity-80">
                  {task.done
                    ? <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" style={{ color: "var(--invicta-green)" }} />
                    : <Circle size={15} className="flex-shrink-0 mt-0.5" style={{ color: "var(--muted-foreground)" }} />}
                  <span className="text-sm" style={{ textDecoration: task.done ? "line-through" : "none", color: task.done ? "var(--muted-foreground)" : "var(--foreground)" }}>
                    {task.text}
                  </span>
                </button>
              ))}
              {tasks.length === 0 && <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>No tasks yet.</p>}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newTask} onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addTask()}
                placeholder="Add task..."
                className="flex-1 px-3 py-2 rounded-lg border text-xs outline-none"
                style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "inherit" }} />
              <button onClick={addTask} className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80"
                style={{ background: "var(--invicta-green)20" }}>
                <Plus size={13} style={{ color: "var(--invicta-green)" }} />
              </button>
            </div>
          </div>

          {/* activity log */}
          <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h2 className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "var(--muted-foreground)" }}>Activity Log</h2>
            <div className="flex flex-col gap-3 mb-3">
              {activity.length === 0 && <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>No activity yet.</p>}
              {activity.map((item, i) => (
                <div key={item.id} className="flex gap-2.5">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: color }} />
                    {i < activity.length - 1 && <div className="flex-1 w-px" style={{ background: "var(--border)" }} />}
                  </div>
                  <div className="pb-2">
                    <p className="text-xs font-bold" style={{ color: "var(--muted-foreground)" }}>
                      {fmtDate(item.created_at)} · {item.profiles?.display_name ?? "you"}
                    </p>
                    <p className="text-sm mt-0.5">{item.details ?? item.action}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newNote} onChange={e => setNewNote(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addNote()}
                placeholder="Log activity..."
                className="flex-1 px-3 py-2 rounded-lg border text-xs outline-none"
                style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "inherit" }} />
              <button onClick={addNote} className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80"
                style={{ background: `${color}20` }}>
                <Plus size={13} style={{ color }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

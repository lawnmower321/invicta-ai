"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, MapPin, User, Phone, Mail, DollarSign,
  TrendingUp, Clock, MessageSquare, Plus, CheckCircle2,
  Circle, ChevronDown, Calculator, Pencil, Save, X,
} from "lucide-react";

const STAGES = ["New Lead", "Contacted", "Qualified", "Offer Made", "Under Contract", "Closed"];
const STAGE_COLORS: Record<string, string> = {
  "New Lead":       "var(--invicta-blue)",
  "Contacted":      "var(--invicta-amber)",
  "Qualified":      "var(--invicta-purple)",
  "Offer Made":     "var(--invicta-green)",
  "Under Contract": "var(--invicta-green)",
  "Closed":         "var(--invicta-red)",
};

// Mock lead — in production this comes from Supabase
const MOCK_LEAD = {
  id: "5",
  address: "211 Cedar Ln, New Rochelle NY 10801",
  owner: "D. Foster",
  phone: "(914) 555-0182",
  email: "dfoster@email.com",
  stage: "Offer Made",
  askPrice: 165000,
  arv: 290000,
  repairEst: 45000,
  beds: 3,
  baths: 2,
  sqft: 1420,
  yearBuilt: 1968,
  source: "Cold Call",
  notes: "Owner inherited property, motivated to sell quickly. Some foundation issues noted — need inspection. Flexible on close date, prefers 30 days.",
  tasks: [
    { id: "t1", text: "Schedule property walkthrough", done: true },
    { id: "t2", text: "Send purchase agreement", done: false },
    { id: "t3", text: "Connect with cash buyer — Mike R.", done: false },
  ],
  activity: [
    { date: "Apr 28", text: "Offer submitted at $165,000" },
    { date: "Apr 25", text: "Qualified — owner confirmed motivation" },
    { date: "Apr 22", text: "First contact via cold call — 12 min conversation" },
    { date: "Apr 20", text: "Lead added to pipeline" },
  ],
};

export default function LeadDetailPage() {
  const router = useRouter();
  const [lead, setLead] = useState(MOCK_LEAD);
  const [stage, setStage] = useState(lead.stage);
  const [stageOpen, setStageOpen] = useState(false);
  const [note, setNote] = useState("");
  const [newTask, setNewTask] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);
  const [noteDraft, setNoteDraft] = useState(lead.notes);

  const mao = Math.round(lead.arv * 0.7 - lead.repairEst);
  const assignmentFee = mao - lead.askPrice;
  const color = STAGE_COLORS[stage] ?? "var(--invicta-green)";

  function toggleTask(id: string) {
    setLead(l => ({
      ...l,
      tasks: l.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t),
    }));
  }

  function addTask() {
    if (!newTask.trim()) return;
    setLead(l => ({
      ...l,
      tasks: [...l.tasks, { id: Date.now().toString(), text: newTask.trim(), done: false }],
    }));
    setNewTask("");
  }

  function addNote() {
    if (!note.trim()) return;
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    setLead(l => ({
      ...l,
      activity: [{ date: today, text: note.trim() }, ...l.activity],
    }));
    setNote("");
  }

  function runComps() {
    router.push(`/comps?address=${encodeURIComponent(lead.address)}&arv=${lead.arv}`);
  }

  return (
    <div className="p-8 max-w-[1100px]">

      {/* back + header */}
      <button onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-bold mb-6 transition-opacity hover:opacity-60"
        style={{ color: "var(--muted-foreground)" }}>
        <ArrowLeft size={15} />
        Back to Pipeline
      </button>

      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={15} style={{ color }} />
            <h1 className="text-2xl font-bold tracking-wide">{lead.address}</h1>
          </div>
          <div className="flex items-center gap-2">
            <User size={13} style={{ color: "var(--muted-foreground)" }} />
            <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              {lead.owner}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: `${color}20`, color }}>
              {lead.source}
            </span>
          </div>
        </div>

        {/* stage selector */}
        <div className="relative">
          <button
            onClick={() => setStageOpen(o => !o)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-sm transition-all"
            style={{ background: `${color}15`, borderColor: color, color }}>
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            {stage}
            <ChevronDown size={14} className={stageOpen ? "rotate-180" : ""} style={{ transition: "transform 0.15s" }} />
          </button>
          {stageOpen && (
            <div className="absolute right-0 top-full mt-1 z-20 rounded-xl border overflow-hidden"
              style={{ background: "var(--card)", borderColor: "var(--border)", minWidth: 180 }}>
              {STAGES.map(s => (
                <button key={s} onClick={() => { setStage(s); setStageOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold text-left transition-opacity hover:opacity-70"
                  style={{ color: STAGE_COLORS[s] ?? "var(--foreground)" }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: STAGE_COLORS[s] }} />
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">

        {/* left col — main info */}
        <div className="col-span-2 flex flex-col gap-4">

          {/* financials card */}
          <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h2 className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--muted-foreground)" }}>
              Deal Numbers
            </h2>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: "Ask Price",    value: `$${lead.askPrice.toLocaleString()}`,  color: "var(--invicta-amber)" },
                { label: "Est. ARV",     value: `$${lead.arv.toLocaleString()}`,       color: "var(--invicta-blue)" },
                { label: "Repair Est.", value: `$${lead.repairEst.toLocaleString()}`,  color: "var(--invicta-red)" },
                { label: "MAO (70%)",   value: `$${mao.toLocaleString()}`,             color: "var(--invicta-purple)" },
              ].map(({ label, value, color: c }) => (
                <div key={label} className="rounded-xl p-3" style={{ background: "var(--surface-2)" }}>
                  <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>{label}</p>
                  <p className="text-lg font-bold" style={{ color: c }}>{value}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <TrendingUp size={14} style={{ color: assignmentFee > 0 ? "var(--invicta-green)" : "var(--invicta-red)" }} />
                <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>Est. Assignment Fee</span>
                <span className="text-lg font-bold"
                  style={{ color: assignmentFee > 0 ? "var(--invicta-green)" : "var(--invicta-red)" }}>
                  {assignmentFee > 0 ? "+" : ""}${assignmentFee.toLocaleString()}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={runComps}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-opacity hover:opacity-80"
                  style={{ background: "var(--invicta-purple)20", color: "var(--invicta-purple)" }}>
                  <TrendingUp size={12} />
                  Run Comps
                </button>
                <button onClick={() => router.push(`/calculator?ask=${lead.askPrice}&arv=${lead.arv}&repair=${lead.repairEst}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-opacity hover:opacity-80"
                  style={{ background: "var(--invicta-green)20", color: "var(--invicta-green)" }}>
                  <Calculator size={12} />
                  Calculator
                </button>
              </div>
            </div>
          </div>

          {/* property details */}
          <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h2 className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--muted-foreground)" }}>
              Property Info
            </h2>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Beds",       value: lead.beds },
                { label: "Baths",      value: lead.baths },
                { label: "Sq Ft",      value: lead.sqft.toLocaleString() },
                { label: "Year Built", value: lead.yearBuilt },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl p-3 text-center" style={{ background: "var(--surface-2)" }}>
                  <p className="text-xl font-bold">{value}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* notes */}
          <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--muted-foreground)" }}>
                Notes
              </h2>
              {editingNotes ? (
                <div className="flex gap-2">
                  <button onClick={() => { setLead(l => ({ ...l, notes: noteDraft })); setEditingNotes(false); }}
                    className="flex items-center gap-1 text-xs font-bold transition-opacity hover:opacity-70"
                    style={{ color: "var(--invicta-green)" }}>
                    <Save size={12} /> Save
                  </button>
                  <button onClick={() => { setNoteDraft(lead.notes); setEditingNotes(false); }}
                    className="flex items-center gap-1 text-xs font-bold transition-opacity hover:opacity-70"
                    style={{ color: "var(--muted-foreground)" }}>
                    <X size={12} /> Cancel
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditingNotes(true)}
                  className="flex items-center gap-1 text-xs font-bold transition-opacity hover:opacity-70"
                  style={{ color: "var(--muted-foreground)" }}>
                  <Pencil size={12} /> Edit
                </button>
              )}
            </div>
            {editingNotes ? (
              <textarea
                value={noteDraft}
                onChange={e => setNoteDraft(e.target.value)}
                rows={4}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
                style={{
                  background: "var(--surface-2)",
                  borderColor: "var(--invicta-green)",
                  color: "var(--foreground)",
                  fontFamily: "inherit",
                }}
              />
            ) : (
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                {lead.notes || "No notes yet."}
              </p>
            )}
          </div>
        </div>

        {/* right col */}
        <div className="flex flex-col gap-4">

          {/* contact */}
          <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h2 className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--muted-foreground)" }}>
              Owner Contact
            </h2>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
                <User size={14} style={{ color }} />
                <span className="text-sm font-bold">{lead.owner}</span>
              </div>
              <a href={`tel:${lead.phone}`}
                className="flex items-center gap-3 p-3 rounded-xl transition-opacity hover:opacity-70"
                style={{ background: "var(--surface-2)" }}>
                <Phone size={14} style={{ color: "var(--invicta-green)" }} />
                <span className="text-sm">{lead.phone}</span>
              </a>
              <a href={`mailto:${lead.email}`}
                className="flex items-center gap-3 p-3 rounded-xl transition-opacity hover:opacity-70"
                style={{ background: "var(--surface-2)" }}>
                <Mail size={14} style={{ color: "var(--invicta-blue)" }} />
                <span className="text-sm">{lead.email}</span>
              </a>
            </div>
          </div>

          {/* tasks */}
          <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h2 className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "var(--muted-foreground)" }}>
              Follow-up Tasks
            </h2>
            <div className="flex flex-col gap-2 mb-3">
              {lead.tasks.map(task => (
                <button key={task.id} onClick={() => toggleTask(task.id)}
                  className="flex items-start gap-2.5 text-left transition-opacity hover:opacity-80">
                  {task.done
                    ? <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" style={{ color: "var(--invicta-green)" }} />
                    : <Circle size={15} className="flex-shrink-0 mt-0.5" style={{ color: "var(--muted-foreground)" }} />}
                  <span className="text-sm" style={{
                    color: task.done ? "var(--muted-foreground)" : "var(--foreground)",
                    textDecoration: task.done ? "line-through" : "none",
                  }}>
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
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                  fontFamily: "inherit",
                }}
              />
              <button onClick={addTask}
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-80"
                style={{ background: "var(--invicta-green)20" }}>
                <Plus size={13} style={{ color: "var(--invicta-green)" }} />
              </button>
            </div>
          </div>

          {/* activity log */}
          <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h2 className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "var(--muted-foreground)" }}>
              Activity Log
            </h2>
            <div className="flex flex-col gap-3 mb-3">
              {lead.activity.map((item, i) => (
                <div key={i} className="flex gap-2.5">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: color }} />
                    {i < lead.activity.length - 1 && (
                      <div className="flex-1 w-px" style={{ background: "var(--border)" }} />
                    )}
                  </div>
                  <div className="pb-2">
                    <p className="text-xs font-bold" style={{ color: "var(--muted-foreground)" }}>{item.date}</p>
                    <p className="text-sm mt-0.5">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addNote()}
                placeholder="Log activity..."
                className="flex-1 px-3 py-2 rounded-lg border text-xs outline-none"
                style={{
                  background: "var(--surface-2)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                  fontFamily: "inherit",
                }}
              />
              <button onClick={addNote}
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-80"
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

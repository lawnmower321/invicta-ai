"use client";

import { useState, useEffect } from "react";
import {
  Bell, CheckCircle2, Circle, Plus, MapPin,
  Clock, AlertCircle, X, Loader2,
} from "lucide-react";
import PageShell from "@/components/PageShell";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

type Task = {
  id: string;
  text: string;
  lead_label: string;
  lead_id: string | null;
  due_date: string;
  done: boolean;
  priority: "high" | "medium" | "low";
};

const TODAY = new Date();
const todayStr = TODAY.toISOString().split("T")[0];

const PRIORITY_CONFIG = {
  high:   { color: "var(--invicta-red)",   label: "High",   bg: "var(--invicta-red)18" },
  medium: { color: "var(--invicta-amber)", label: "Medium", bg: "var(--invicta-amber)18" },
  low:    { color: "var(--invicta-blue)",  label: "Low",    bg: "var(--invicta-blue)18" },
};

function isOverdue(d: string) { return d < todayStr; }
function isToday(d: string)   { return d === todayStr; }

const displayDate = (d: string) => {
  const tomorrow = new Date(TODAY.getTime() + 86400000).toISOString().split("T")[0];
  const yesterday = new Date(TODAY.getTime() - 86400000).toISOString().split("T")[0];
  if (d === todayStr)  return "Today";
  if (d === tomorrow)  return "Tomorrow";
  if (d === yesterday) return "Yesterday";
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function FollowupsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "today" | "overdue" | "upcoming">("all");
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({ text: "", lead_label: "", due_date: todayStr, priority: "medium" as Task["priority"] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
    fetchTasks();
  }, []);

  async function fetchTasks() {
    const { data } = await supabase
      .from("followups")
      .select("*")
      .order("due_date", { ascending: true });
    setTasks(data ?? []);
    setLoading(false);
  }

  async function toggle(id: string) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newDone = !task.done;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: newDone } : t));
    await supabase.from("followups").update({ done: newDone }).eq("id", id);
  }

  async function addTask() {
    if (!newTask.text.trim()) return;
    setSaving(true);
    const { data } = await supabase.from("followups").insert({
      text: newTask.text.trim(),
      lead_label: newTask.lead_label.trim() || "General",
      due_date: newTask.due_date,
      priority: newTask.priority,
      done: false,
      user_id: userId,
    }).select().single();
    if (data) setTasks(prev => [data, ...prev]);
    setNewTask({ text: "", lead_label: "", due_date: todayStr, priority: "medium" });
    setShowModal(false);
    setSaving(false);
  }

  const filtered = tasks.filter(t => {
    if (filter === "today")    return isToday(t.due_date) && !t.done;
    if (filter === "overdue")  return isOverdue(t.due_date) && !t.done;
    if (filter === "upcoming") return !isOverdue(t.due_date) && !isToday(t.due_date) && !t.done;
    return true;
  });

  const counts = {
    today:    tasks.filter(t => isToday(t.due_date) && !t.done).length,
    overdue:  tasks.filter(t => isOverdue(t.due_date) && !t.done).length,
    upcoming: tasks.filter(t => !isOverdue(t.due_date) && !isToday(t.due_date) && !t.done).length,
    all:      tasks.length,
  };

  return (
    <PageShell
      title="Follow-ups"
      subtitle="Tasks & reminders"
      action={
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-sm"
          style={{ background: "var(--invicta-amber)", color: "#000" }}>
          <Plus size={14} /> Add
        </button>
      }>

      {/* filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["all", "overdue", "today", "upcoming"] as const).map(f => {
          const labels = { all: "All", overdue: "Overdue", today: "Today", upcoming: "Upcoming" };
          const colors = { all: "var(--invicta-blue)", overdue: "var(--invicta-red)", today: "var(--invicta-amber)", upcoming: "var(--invicta-green)" };
          const active = filter === f;
          return (
            <button key={f} onClick={() => setFilter(f)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={{
                background: active ? `${colors[f]}20` : "var(--surface)",
                color: active ? colors[f] : "var(--muted-foreground)",
                border: active ? `1px solid ${colors[f]}` : "1px solid var(--border)",
              }}>
              {labels[f]}
              <span className="text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: `${colors[f]}20`, color: colors[f] }}>
                {counts[f]}
              </span>
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--invicta-amber)" }} />
        </div>
      )}

      {/* task list */}
      {!loading && (
        <div className="flex flex-col gap-2">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed"
              style={{ borderColor: "var(--border)" }}>
              <CheckCircle2 size={32} className="mb-3" style={{ color: "var(--invicta-green)" }} />
              <p className="font-bold">All clear</p>
              <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
                {tasks.length === 0 ? "Add your first follow-up task" : "No tasks in this view"}
              </p>
            </div>
          )}
          {filtered.map(task => {
            const pCfg = PRIORITY_CONFIG[task.priority];
            const overdue = isOverdue(task.due_date) && !task.done;
            const today = isToday(task.due_date);
            return (
              <div key={task.id}
                className="rounded-2xl border p-4 flex items-start gap-4 transition-all"
                style={{
                  background: "var(--surface)",
                  borderColor: overdue ? "var(--invicta-red)40" : "var(--border)",
                  opacity: task.done ? 0.5 : 1,
                }}>
                <button onClick={() => toggle(task.id)} className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110">
                  {task.done
                    ? <CheckCircle2 size={18} style={{ color: "var(--invicta-green)" }} />
                    : <Circle size={18} style={{ color: "var(--muted-foreground)" }} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm" style={{ textDecoration: task.done ? "line-through" : "none" }}>
                    {task.text}
                  </p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {task.lead_label !== "General" && (
                      <div className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        <MapPin size={10} />{task.lead_label}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs"
                      style={{ color: overdue ? "var(--invicta-red)" : today ? "var(--invicta-amber)" : "var(--muted-foreground)" }}>
                      {overdue ? <AlertCircle size={10} /> : <Clock size={10} />}
                      {displayDate(task.due_date)}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: pCfg.bg, color: pCfg.color }}>
                  {pCfg.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* add task modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="w-full max-w-md rounded-2xl border p-6"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">New Follow-up Task</h2>
              <button onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-60"
                style={{ background: "var(--surface-3)" }}>
                <X size={14} />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold tracking-wider uppercase"
                  style={{ color: "var(--muted-foreground)" }}>Task *</label>
                <input type="text" value={newTask.text}
                  onChange={e => setNewTask(n => ({ ...n, text: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && addTask()}
                  placeholder="Call back seller..."
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "inherit" }}
                  onFocus={e => (e.target.style.borderColor = "var(--invicta-amber)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold tracking-wider uppercase"
                  style={{ color: "var(--muted-foreground)" }}>Lead / Property</label>
                <input type="text" value={newTask.lead_label}
                  onChange={e => setNewTask(n => ({ ...n, lead_label: e.target.value }))}
                  placeholder="Address or leave blank for General"
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "inherit" }}
                  onFocus={e => (e.target.style.borderColor = "var(--invicta-amber)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold tracking-wider uppercase"
                    style={{ color: "var(--muted-foreground)" }}>Due Date</label>
                  <input type="date" value={newTask.due_date}
                    onChange={e => setNewTask(n => ({ ...n, due_date: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "inherit", colorScheme: "dark" }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold tracking-wider uppercase"
                    style={{ color: "var(--muted-foreground)" }}>Priority</label>
                  <div className="flex flex-col gap-1">
                    {(["high", "medium", "low"] as const).map(p => (
                      <button key={p} onClick={() => setNewTask(n => ({ ...n, priority: p }))}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-left"
                        style={{
                          background: newTask.priority === p ? `${PRIORITY_CONFIG[p].color}20` : "var(--surface-3)",
                          color: newTask.priority === p ? PRIORITY_CONFIG[p].color : "var(--muted-foreground)",
                          border: newTask.priority === p ? `1px solid ${PRIORITY_CONFIG[p].color}` : "1px solid var(--border)",
                        }}>
                        {PRIORITY_CONFIG[p].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: "var(--surface-3)", color: "var(--muted-foreground)" }}>
                Cancel
              </button>
              <button onClick={addTask} disabled={saving}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                style={{ background: "var(--invicta-amber)", color: "#000" }}>
                {saving && <Loader2 size={14} className="animate-spin" />}
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

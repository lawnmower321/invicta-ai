"use client";

import { useState } from "react";
import {
  Bell, CheckCircle2, Circle, Plus, MapPin,
  Clock, AlertCircle, Calendar, X,
} from "lucide-react";

type Task = {
  id: string;
  text: string;
  lead: string;
  leadId: string;
  dueDate: string;
  done: boolean;
  priority: "high" | "medium" | "low";
};

const TODAY = new Date();
const fmt = (d: Date) => d.toISOString().split("T")[0];
const todayStr = fmt(TODAY);
const yesterday = fmt(new Date(TODAY.getTime() - 86400000));
const tomorrow = fmt(new Date(TODAY.getTime() + 86400000));
const in3Days = fmt(new Date(TODAY.getTime() + 3 * 86400000));

const INITIAL_TASKS: Task[] = [
  { id: "t1", text: "Send purchase agreement",            lead: "211 Cedar Ln, New Rochelle NY", leadId: "5", dueDate: todayStr,    done: false, priority: "high" },
  { id: "t2", text: "Call back — left voicemail",         lead: "88 Maple Ave, Yonkers NY",      leadId: "2", dueDate: todayStr,    done: false, priority: "high" },
  { id: "t3", text: "Follow up on inspection report",     lead: "33 Birch Blvd, Ossining NY",    leadId: "6", dueDate: todayStr,    done: false, priority: "medium" },
  { id: "t4", text: "Schedule walkthrough",               lead: "142 Oak St, Peekskill NY",      leadId: "1", dueDate: yesterday,   done: false, priority: "high" },
  { id: "t5", text: "Send comps analysis to buyer",       lead: "7 Elm Dr, Mount Vernon NY",     leadId: "4", dueDate: yesterday,   done: true,  priority: "medium" },
  { id: "t6", text: "Verify proof of funds from buyer",   lead: "211 Cedar Ln, New Rochelle NY", leadId: "5", dueDate: tomorrow,    done: false, priority: "medium" },
  { id: "t7", text: "Check title company status",         lead: "33 Birch Blvd, Ossining NY",    leadId: "6", dueDate: in3Days,     done: false, priority: "low" },
  { id: "t8", text: "Cold call follow-up batch (10 leads)", lead: "General",                     leadId: "",  dueDate: in3Days,     done: false, priority: "low" },
];

const PRIORITY_CONFIG = {
  high:   { color: "var(--invicta-red)",    label: "High",   bg: "var(--invicta-red)18" },
  medium: { color: "var(--invicta-amber)",  label: "Medium", bg: "var(--invicta-amber)18" },
  low:    { color: "var(--invicta-blue)",   label: "Low",    bg: "var(--invicta-blue)18" },
};

function isOverdue(dueDate: string) { return dueDate < todayStr; }
function isToday(dueDate: string)   { return dueDate === todayStr; }

export default function FollowupsPage() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [filter, setFilter] = useState<"all" | "today" | "overdue" | "upcoming">("all");
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({ text: "", lead: "", dueDate: todayStr, priority: "medium" as Task["priority"] });

  function toggle(id: string) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }

  function addTask() {
    if (!newTask.text.trim()) return;
    setTasks(prev => [{
      id: Date.now().toString(),
      text: newTask.text.trim(),
      lead: newTask.lead.trim() || "General",
      leadId: "",
      dueDate: newTask.dueDate,
      done: false,
      priority: newTask.priority,
    }, ...prev]);
    setNewTask({ text: "", lead: "", dueDate: todayStr, priority: "medium" });
    setShowModal(false);
  }

  const filtered = tasks.filter(t => {
    if (filter === "today")    return isToday(t.dueDate) && !t.done;
    if (filter === "overdue")  return isOverdue(t.dueDate) && !t.done;
    if (filter === "upcoming") return !isOverdue(t.dueDate) && !isToday(t.dueDate) && !t.done;
    return true;
  });

  const counts = {
    today:    tasks.filter(t => isToday(t.dueDate) && !t.done).length,
    overdue:  tasks.filter(t => isOverdue(t.dueDate) && !t.done).length,
    upcoming: tasks.filter(t => !isOverdue(t.dueDate) && !isToday(t.dueDate) && !t.done).length,
    all:      tasks.length,
  };

  const displayDate = (d: string) => {
    if (d === todayStr)   return "Today";
    if (d === yesterday)  return "Yesterday";
    if (d === tomorrow)   return "Tomorrow";
    return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="p-8 max-w-[800px]">
      {/* header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-bold tracking-widest uppercase mb-1"
            style={{ color: "var(--muted-foreground)" }}>
            Task Management
          </p>
          <h1 className="text-3xl font-bold tracking-wide">Follow-ups</h1>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90"
          style={{ background: "var(--invicta-amber)", color: "#000" }}>
          <Plus size={16} />
          Add Task
        </button>
      </div>

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

      {/* task list */}
      <div className="flex flex-col gap-2">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed"
            style={{ borderColor: "var(--border)" }}>
            <CheckCircle2 size={32} className="mb-3" style={{ color: "var(--invicta-green)" }} />
            <p className="font-bold">All clear</p>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>No tasks in this view</p>
          </div>
        )}
        {filtered.map(task => {
          const pCfg = PRIORITY_CONFIG[task.priority];
          const overdue = isOverdue(task.dueDate) && !task.done;
          const today = isToday(task.dueDate);

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
                  {task.lead !== "General" && (
                    <div className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                      <MapPin size={10} />{task.lead}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs"
                    style={{ color: overdue ? "var(--invicta-red)" : today ? "var(--invicta-amber)" : "var(--muted-foreground)" }}>
                    {overdue ? <AlertCircle size={10} /> : <Clock size={10} />}
                    {displayDate(task.dueDate)}
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
                <input type="text" value={newTask.lead}
                  onChange={e => setNewTask(n => ({ ...n, lead: e.target.value }))}
                  placeholder="Address or leave blank"
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
                  <input type="date" value={newTask.dueDate}
                    onChange={e => setNewTask(n => ({ ...n, dueDate: e.target.value }))}
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
              <button onClick={addTask}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: "var(--invicta-amber)", color: "#000" }}>
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

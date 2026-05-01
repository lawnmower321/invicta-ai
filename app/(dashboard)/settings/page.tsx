"use client";

import { useState, useEffect } from "react";
import { User, Bell, Map, Key, Save, Check, Globe } from "lucide-react";
import PageShell from "@/components/PageShell";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

type Tab = "profile" | "markets" | "notifications" | "integrations";

const TABS: { id: Tab; label: string; icon: React.FC<any> }[] = [
  { id: "profile",       label: "Profile",      icon: User },
  { id: "markets",       label: "Markets",       icon: Map },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "integrations",  label: "Integrations",  icon: Key },
];

function SaveBtn({ onClick, saved }: { onClick: () => void; saved: boolean }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all"
      style={{ background: saved ? "var(--invicta-green)20" : "var(--invicta-green)", color: saved ? "var(--invicta-green)" : "#000" }}>
      {saved ? <Check size={14} /> : <Save size={14} />}
      {saved ? "Saved" : "Save Changes"}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold tracking-wider uppercase"
        style={{ color: "var(--muted-foreground)" }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", readOnly }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; readOnly?: boolean;
}) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
      style={{
        background: readOnly ? "var(--surface-3)" : "var(--surface-2)",
        borderColor: "var(--border)",
        color: readOnly ? "var(--muted-foreground)" : "var(--foreground)",
        fontFamily: "inherit",
        cursor: readOnly ? "default" : undefined,
      }}
      onFocus={e => { if (!readOnly) e.target.style.borderColor = "var(--invicta-green)"; }}
      onBlur={e => (e.target.style.borderColor = "var(--border)")}
    />
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [partnerName, setPartnerName] = useState("Kol (Koli)");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("Invicta.ai Wholesale");
  const [phone, setPhone] = useState("");

  const [targetMarkets, setTargetMarkets] = useState("Westchester NY, Bronx NY, Yonkers NY, New Rochelle NY");
  const [minPrice, setMinPrice] = useState("60000");
  const [maxPrice, setMaxPrice] = useState("400000");
  const [propTypes, setPropTypes] = useState("SFR, MFR, Land");
  const [maoFactor, setMaoFactor] = useState("70");

  const [notifs, setNotifs] = useState({
    newLead: true, followupDue: true, dealMoved: false, weeklyDigest: true,
  });

  const [propStreamKey, setPropStreamKey] = useState("");
  const [batchLeadsKey, setBatchLeadsKey] = useState("");
  const [posthogKey, setPosthogKey] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (data.user?.email) setEmail(data.user.email);
      if (!uid) return;
      const { data: profile } = await supabase
        .from("profiles").select("display_name").eq("id", uid).single();
      if (profile?.display_name) setName(profile.display_name);
    });
  }, []);

  async function save() {
    if (userId && name.trim()) {
      await supabase.from("profiles")
        .update({ display_name: name.trim() })
        .eq("id", userId);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <PageShell title="Settings">
      <div className="flex flex-col md:flex-row gap-6">
        {/* sidebar nav */}
        <div className="flex flex-row md:flex-col gap-1 md:w-44 flex-shrink-0 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-left transition-all"
                style={{
                  background: active ? "var(--invicta-green)15" : "transparent",
                  color: active ? "var(--invicta-green)" : "var(--muted-foreground)",
                }}>
                <Icon size={15} />
                {label}
              </button>
            );
          })}
        </div>

        {/* content */}
        <div className="flex-1">
          {tab === "profile" && (
            <div className="rounded-2xl border p-6 flex flex-col gap-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between">
                <h2 className="font-bold">Your Profile</h2>
                <SaveBtn onClick={save} saved={saved} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Your Name">
                  <Input value={name} onChange={setName} placeholder="Brendan Morsey" />
                </Field>
                <Field label="Partner Name">
                  <Input value={partnerName} onChange={setPartnerName} placeholder="Kol (Koli)" />
                </Field>
                <Field label="Email">
                  <Input value={email} onChange={() => {}} readOnly />
                </Field>
                <Field label="Phone">
                  <Input value={phone} onChange={setPhone} placeholder="(914) 555-0000" />
                </Field>
              </div>
              <Field label="Company / Business Name">
                <Input value={company} onChange={setCompany} placeholder="Invicta Wholesale LLC" />
              </Field>
              <div className="pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                <p className="text-xs font-bold tracking-widets uppercase mb-3" style={{ color: "var(--muted-foreground)" }}>
                  Change Password
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="New Password"><Input value="" onChange={() => {}} type="password" placeholder="••••••••" /></Field>
                  <Field label="Confirm Password"><Input value="" onChange={() => {}} type="password" placeholder="••••••••" /></Field>
                </div>
              </div>
            </div>
          )}

          {tab === "markets" && (
            <div className="rounded-2xl border p-6 flex flex-col gap-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between">
                <h2 className="font-bold">Market Targets</h2>
                <SaveBtn onClick={save} saved={saved} />
              </div>
              <Field label="Target Markets (comma-separated)">
                <textarea value={targetMarkets} onChange={e => setTargetMarkets(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "inherit" }}
                  onFocus={e => (e.target.style.borderColor = "var(--invicta-green)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Min Price Target"><Input value={minPrice} onChange={setMinPrice} placeholder="60000" /></Field>
                <Field label="Max Price Target"><Input value={maxPrice} onChange={setMaxPrice} placeholder="400000" /></Field>
              </div>
              <Field label="Property Types">
                <Input value={propTypes} onChange={setPropTypes} placeholder="SFR, MFR, Land" />
              </Field>
              <Field label={`MAO Factor: ${maoFactor}%`}>
                <input type="range" min={60} max={80} step={1} value={maoFactor}
                  onChange={e => setMaoFactor(e.target.value)}
                  className="w-full h-1.5 rounded-full"
                  style={{ accentColor: "var(--invicta-green)" }}
                />
                <div className="flex justify-between text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                  <span>60%</span><span>70% default</span><span>80%</span>
                </div>
              </Field>
            </div>
          )}

          {tab === "notifications" && (
            <div className="rounded-2xl border p-6 flex flex-col gap-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-bold">Notifications</h2>
                <SaveBtn onClick={save} saved={saved} />
              </div>
              {[
                { key: "newLead",      label: "New Lead Added",      desc: "When a lead enters the pipeline or scraper finds new results" },
                { key: "followupDue",  label: "Follow-up Due",       desc: "Reminder when a follow-up task is due today" },
                { key: "dealMoved",    label: "Deal Stage Changed",  desc: "When a deal moves to a new pipeline stage" },
                { key: "weeklyDigest", label: "Weekly Digest Email", desc: "Summary of pipeline activity every Monday" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-3 border-b last:border-0"
                  style={{ borderColor: "var(--border)" }}>
                  <div>
                    <p className="text-sm font-bold">{label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{desc}</p>
                  </div>
                  <button
                    onClick={() => setNotifs(n => ({ ...n, [key]: !n[key as keyof typeof n] }))}
                    className="w-11 h-6 rounded-full relative transition-all"
                    style={{ background: (notifs as any)[key] ? "var(--invicta-green)" : "var(--surface-3)" }}>
                    <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform"
                      style={{ background: "#fff", transform: (notifs as any)[key] ? "translateX(20px)" : "translateX(0)" }} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === "integrations" && (
            <div className="rounded-2xl border p-6 flex flex-col gap-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between">
                <h2 className="font-bold">Integrations</h2>
                <SaveBtn onClick={save} saved={saved} />
              </div>
              <div className="rounded-xl p-3 flex items-center gap-2"
                style={{ background: "var(--invicta-blue)12", border: "1px solid var(--invicta-blue)30" }}>
                <Globe size={14} style={{ color: "var(--invicta-blue)" }} />
                <p className="text-xs" style={{ color: "var(--invicta-blue)" }}>
                  API keys are encrypted and never exposed in your browser.
                </p>
              </div>
              <Field label="PropStream API Key">
                <Input value={propStreamKey} onChange={setPropStreamKey} type="password" placeholder="sk-propstream-..." />
              </Field>
              <p className="text-xs -mt-3" style={{ color: "var(--muted-foreground)" }}>
                Unlocks real-time MLS data, owner skip-tracing & advanced comps.
              </p>
              <Field label="BatchLeads API Key">
                <Input value={batchLeadsKey} onChange={setBatchLeadsKey} type="password" placeholder="batchleads-..." />
              </Field>
              <p className="text-xs -mt-3" style={{ color: "var(--muted-foreground)" }}>
                Enables bulk lead lists and direct mail integration.
              </p>
              <div className="pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "var(--muted-foreground)" }}>
                  Analytics
                </p>
                <Field label="PostHog Project Key">
                  <Input value={posthogKey} onChange={setPosthogKey} type="password" placeholder="phc_..." />
                </Field>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

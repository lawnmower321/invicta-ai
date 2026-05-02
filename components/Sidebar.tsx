"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Kanban, Users, Calculator,
  TrendingUp, Bell, Radio, BarChart3,
  Settings, LogOut, ChevronRight, Grid3x3, GraduationCap,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { href: "/pipeline",   label: "Pipeline",   icon: Kanban },
  { href: "/buyers",     label: "Buyers",     icon: Users },
  { href: "/comps",      label: "Comps",      icon: TrendingUp },
  { href: "/calculator", label: "Calculator", icon: Calculator },
  { href: "/followups",  label: "Follow-ups", icon: Bell },
  { href: "/scraper",    label: "Scraper",    icon: Radio },
  { href: "/analytics",  label: "Analytics",  icon: BarChart3 },
  { href: "/learn",      label: "Learn",       icon: GraduationCap },
];

const mobileNav = [
  { href: "/dashboard",  label: "Home",     icon: LayoutDashboard },
  { href: "/pipeline",   label: "Pipeline", icon: Kanban },
  { href: "/scraper",    label: "Scraper",  icon: Radio, live: true },
  { href: "/followups",  label: "Tasks",    icon: Bell },
  { href: "/settings",   label: "More",     icon: Grid3x3 },
];

const moreItems = [
  { href: "/buyers",     label: "Cash Buyers",  icon: Users },
  { href: "/comps",      label: "Comps Tool",   icon: TrendingUp },
  { href: "/calculator", label: "Calculator",   icon: Calculator },
  { href: "/analytics",  label: "Analytics",    icon: BarChart3 },
  { href: "/learn",      label: "Learn",        icon: GraduationCap },
  { href: "/settings",   label: "Settings",     icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-[220px] flex-col border-r z-40"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>

        <div className="px-5 py-6 border-b" style={{ borderColor: "var(--border)" }}>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--invicta-green)" }}>
              <span className="text-black font-bold text-xs">I</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-wider">INVICTA</span>
              <span className="text-xs px-1 py-0.5 rounded font-bold tracking-wider"
                style={{ background: "var(--invicta-green)", color: "#000", fontSize: "9px" }}>AI</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all group relative"
                style={{
                  background: active ? "var(--invicta-green)15" : "transparent",
                  color: active ? "var(--invicta-green)" : "var(--muted-foreground)",
                }}>
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                    style={{ background: "var(--invicta-green)" }} />
                )}
                <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                <span>{label}</span>
                {label === "Scraper" && (
                  <span className="ml-auto w-2 h-2 rounded-full animate-pulse flex-shrink-0"
                    style={{ background: "var(--invicta-red)" }} />
                )}
                {active && label !== "Scraper" && <ChevronRight size={12} className="ml-auto opacity-50" />}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t flex flex-col gap-0.5" style={{ borderColor: "var(--border)" }}>
          <Link href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all"
            style={{
              color: pathname === "/settings" ? "var(--invicta-green)" : "var(--muted-foreground)",
              background: pathname === "/settings" ? "var(--invicta-green)15" : "transparent",
            }}>
            <Settings size={16} /><span>Settings</span>
          </Link>
          <form action="/auth/signout" method="post">
            <button type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold tracking-wide hover:opacity-80"
              style={{ color: "var(--invicta-red)" }}>
              <LogOut size={16} /><span>Sign Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 border-b"
        style={{ background: "var(--surface)", borderColor: "var(--border)", height: 52 }}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: "var(--invicta-green)" }}>
            <span className="text-black font-bold" style={{ fontSize: 11 }}>I</span>
          </div>
          <span className="font-bold text-sm tracking-widest">INVICTA</span>
          <span className="font-bold px-1 py-0.5 rounded"
            style={{ background: "var(--invicta-green)", color: "#000", fontSize: 9 }}>AI</span>
        </Link>
        <form action="/auth/signout" method="post">
          <button type="submit" className="p-2" style={{ color: "var(--muted-foreground)" }}>
            <LogOut size={17} />
          </button>
        </form>
      </div>

      {/* ── More sheet (mobile) ── */}
      {showMore && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowMore(false)}>
          <div className="rounded-t-3xl border-t px-4 pt-4 pb-10"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "var(--border)" }} />
            <div className="grid grid-cols-3 gap-3">
              {moreItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link key={href} href={href} onClick={() => setShowMore(false)}
                    className="flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all"
                    style={{
                      background: active ? "var(--invicta-green)15" : "var(--surface-2)",
                      borderColor: active ? "var(--invicta-green)" : "var(--border)",
                      color: active ? "var(--invicta-green)" : "var(--muted-foreground)",
                    }}>
                    <Icon size={22} strokeWidth={1.8} />
                    <span className="text-xs font-bold">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}>
        <div className="flex items-stretch">
          {mobileNav.map(({ href, label, icon: Icon, live }) => {
            const isMore = label === "More";
            const active = isMore ? showMore : (pathname === href || pathname.startsWith(href + "/"));

            if (isMore) {
              return (
                <button key="more"
                  onClick={() => setShowMore(o => !o)}
                  className="flex-1 flex flex-col items-center justify-center py-3 gap-1 relative transition-all"
                  style={{ color: showMore ? "var(--invicta-green)" : "var(--muted-foreground)" }}>
                  <Icon size={21} strokeWidth={showMore ? 2.5 : 1.8} />
                  <span className="font-bold" style={{ fontSize: 10 }}>{label}</span>
                  {showMore && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                      style={{ background: "var(--invicta-green)" }} />
                  )}
                </button>
              );
            }

            return (
              <Link key={href} href={href}
                className="flex-1 flex flex-col items-center justify-center py-3 gap-1 relative transition-all"
                style={{ color: active ? "var(--invicta-green)" : "var(--muted-foreground)" }}>
                <div className="relative">
                  <Icon size={21} strokeWidth={active ? 2.5 : 1.8} />
                  {live && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border animate-pulse"
                      style={{ background: "var(--invicta-red)", borderColor: "var(--surface)" }} />
                  )}
                </div>
                <span className="font-bold" style={{ fontSize: 10 }}>{label}</span>
                {active && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{ background: "var(--invicta-green)" }} />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

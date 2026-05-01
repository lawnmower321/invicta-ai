"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Kanban, Users, Calculator,
  TrendingUp, Bell, Radio, BarChart3,
  Settings, LogOut, ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { href: "/pipeline",   label: "Pipeline",   icon: Kanban },
  { href: "/buyers",     label: "Buyers",     icon: Users },
  { href: "/comps",      label: "Comps",      icon: TrendingUp },
  { href: "/calculator", label: "Calculator", icon: Calculator },
  { href: "/followups",  label: "Follow-ups", icon: Bell },
  { href: "/scraper",    label: "Scraper",    icon: Radio },
  { href: "/analytics",  label: "Analytics",  icon: BarChart3 },
];

// Bottom nav shows only the 5 most important items on mobile
const mobileNav = [
  { href: "/dashboard",  label: "Home",     icon: LayoutDashboard },
  { href: "/pipeline",   label: "Pipeline", icon: Kanban },
  { href: "/followups",  label: "Tasks",    icon: Bell },
  { href: "/calculator", label: "Calc",     icon: Calculator },
  { href: "/settings",   label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-[220px] flex-col border-r z-40"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>

        {/* logo */}
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

        {/* nav */}
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
                {active && <ChevronRight size={12} className="ml-auto opacity-50" />}
              </Link>
            );
          })}
        </nav>

        {/* bottom */}
        <div className="px-3 py-4 border-t flex flex-col gap-0.5" style={{ borderColor: "var(--border)" }}>
          <Link href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all"
            style={{
              color: pathname === "/settings" ? "var(--invicta-green)" : "var(--muted-foreground)",
              background: pathname === "/settings" ? "var(--invicta-green)15" : "transparent",
            }}>
            <Settings size={16} />
            <span>Settings</span>
          </Link>
          <form action="/auth/signout" method="post">
            <button type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all hover:opacity-80"
              style={{ color: "var(--invicta-red)" }}>
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t flex items-stretch"
        style={{ background: "var(--surface)", borderColor: "var(--border)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        {mobileNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all"
              style={{ color: active ? "var(--invicta-green)" : "var(--muted-foreground)" }}>
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-bold tracking-wide">{label}</span>
              {active && (
                <div className="absolute bottom-0 w-8 h-0.5 rounded-full"
                  style={{ background: "var(--invicta-green)" }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 border-b"
        style={{ background: "var(--surface)", borderColor: "var(--border)", height: 56 }}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--invicta-green)" }}>
            <span className="text-black font-bold text-xs">I</span>
          </div>
          <span className="font-bold text-sm tracking-wider">INVICTA</span>
          <span className="text-xs px-1 py-0.5 rounded font-bold"
            style={{ background: "var(--invicta-green)", color: "#000", fontSize: "9px" }}>AI</span>
        </Link>
        <form action="/auth/signout" method="post">
          <button type="submit" style={{ color: "var(--muted-foreground)" }}>
            <LogOut size={18} />
          </button>
        </form>
      </div>
    </>
  );
}

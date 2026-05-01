"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Kanban,
  Users,
  Calculator,
  TrendingUp,
  Bell,
  Radio,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/buyers", label: "Cash Buyers", icon: Users },
  { href: "/comps", label: "Comps Tool", icon: TrendingUp },
  { href: "/calculator", label: "Calculator", icon: Calculator },
  { href: "/followups", label: "Follow-ups", icon: Bell },
  { href: "/scraper", label: "Scraper", icon: Radio },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] flex flex-col border-r z-40"
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
              }}
            >
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
  );
}

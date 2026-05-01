import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--background)" }}>
      <Sidebar />
      {/* desktop: offset for sidebar. mobile: offset for top bar + bottom nav */}
      <main className="flex-1 md:ml-[220px] min-h-screen mt-[56px] md:mt-0 mb-[72px] md:mb-0">
        {children}
      </main>
    </div>
  );
}

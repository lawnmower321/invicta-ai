"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  back?: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export default function PageShell({ title, subtitle, back, action, children }: Props) {
  const router = useRouter();

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* header */}
      <div className="sticky top-[52px] md:top-0 z-30 border-b px-5 md:px-8"
        style={{ background: "var(--background)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3 min-w-0">
            {back && (
              <button onClick={() => router.back()}
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-60"
                style={{ background: "var(--surface-2)" }}>
                <ArrowLeft size={15} />
              </button>
            )}
            <div className="min-w-0">
              <h1 className="font-bold text-lg leading-none truncate">{title}</h1>
              {subtitle && (
                <p className="text-xs mt-0.5 truncate" style={{ color: "var(--muted-foreground)" }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div className="flex-shrink-0 ml-3">{action}</div>}
        </div>
      </div>

      {/* content */}
      <div className="px-5 md:px-8 py-5 max-w-[1000px] mx-auto">
        {children}
      </div>
    </div>
  );
}

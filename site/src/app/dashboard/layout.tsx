"use client";

import { AuthGate } from "@/components/auth-gate";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Anchor, LogOut } from "lucide-react";

const DashboardNav = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="border-b border-border">
      <div className="mx-auto max-w-5xl px-6 py-3 flex items-center justify-between">
        <a
          href="/dashboard"
          className="flex items-center gap-2 font-mono text-sm font-bold tracking-tight"
        >
          <Anchor className="h-4 w-4 text-hook" />
          <span>captain hook</span>
        </a>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-mono">
            {user?.email}
          </span>
          <ThemeToggle />
          <button
            onClick={signOut}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => (
  <AuthGate>
    <div className="min-h-screen flex flex-col">
      <DashboardNav />
      <main className="flex-1 mx-auto max-w-5xl w-full px-6 py-8">
        {children}
      </main>
    </div>
  </AuthGate>
);

export { DashboardLayout as default };

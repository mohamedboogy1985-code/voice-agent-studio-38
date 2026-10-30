import { Link, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { Bot, ClipboardCheck, History, Laptop, ListChecks, Menu, Mic, Pause, Play, Settings, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import type { TKey } from "@/lib/i18n";

const NAV: { to: "/" | "/tasks" | "/approvals" | "/agents" | "/devices" | "/audit" | "/settings"; k: TKey; icon: typeof Mic }[] = [
  { to: "/", k: "command", icon: Mic },
  { to: "/tasks", k: "tasks", icon: ListChecks },
  { to: "/approvals", k: "approvals", icon: ClipboardCheck },
  { to: "/agents", k: "agents", icon: Bot },
  { to: "/devices", k: "devices", icon: Laptop },
  { to: "/audit", k: "audit", icon: History },
  { to: "/settings", k: "settings", icon: Settings },
];

export function AppShell() {
  const { s, t, setLang, stopAll, togglePause } = useStore();
  const [open, setOpen] = useState(false);
  const pending = s.tasks.flatMap((x) => x.steps).filter((x) => x.status === "awaiting_approval").length;
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className={`${open ? "flex" : "hidden"} fixed inset-y-0 start-0 z-40 w-60 flex-col bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:flex md:h-screen`}>
        <div className="px-5 py-6 font-display text-xl font-semibold">{t("app")}</div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map(({ to, k, icon: Icon }) => (
            <Link key={to} to={to} onClick={() => setOpen(false)} activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-sidebar-ring"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium" }}>
              <Icon className="h-4 w-4" />{t(k)}
              {to === "/approvals" && pending > 0 && <span className="ms-auto rounded-full bg-signal px-2 text-xs text-signal-foreground">{pending}</span>}
            </Link>
          ))}
        </nav>
        <div className="p-4 text-xs opacity-70">{s.devices.length ? `${s.devices.length} PC paired` : t("companionMissing")}</div>
      </aside>
      {open && <button aria-label="Close menu" className="fixed inset-0 z-30 bg-foreground/30 md:hidden" onClick={() => setOpen(false)} />}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b bg-background/90 px-4 py-3 backdrop-blur">
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu" onClick={() => setOpen(true)}><Menu /></Button>
          <div className="ms-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setLang(s.lang === "en" ? "ar" : "en")}>{s.lang === "en" ? "العربية" : "English"}</Button>
            <Button variant="outline" size="sm" onClick={togglePause}>{s.paused ? <Play /> : <Pause />}{s.paused ? t("resume") : t("pause")}</Button>
            <Button variant="destructive" size="sm" onClick={stopAll}><Square />{t("stopAll")}</Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  );
}

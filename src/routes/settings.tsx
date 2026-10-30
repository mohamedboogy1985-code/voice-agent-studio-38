import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [
    { title: "Settings — OmniAgent" }, { name: "description", content: "Language, voice and live provider status." },
    { property: "og:title", content: "Settings — OmniAgent" }, { property: "og:description", content: "OmniAgent preferences and provider status." },
  ] }),
  component: () => {
    const { s, t, setLang, resetDemo } = useStore();
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-semibold">{t("settings")}</h1>
        <section className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold">{t("language")}</h2>
          <div className="mt-2 flex gap-2">
            <Button variant={s.lang === "en" ? "default" : "outline"} onClick={() => setLang("en")}>English</Button>
            <Button variant={s.lang === "ar" ? "default" : "outline"} onClick={() => setLang("ar")}>العربية</Button>
          </div>
        </section>
        <section className="rounded-xl border bg-card p-4 text-sm">
          <h2 className="font-semibold">Live providers</h2>
          <ul className="mt-2 space-y-1">
            <li>AI planning and research: <b>not connected</b> — demo planner runs in your browser.</li>
            <li>Voice: browser speech (demo). Cloud speech: <b>not connected</b>.</li>
            <li>Windows companion: <b>{s.devices.length ? "paired" : "not paired"}</b>.</li>
          </ul>
          <p className="mt-2 text-muted-foreground">Provider keys will only ever be stored on the server, never in the browser.</p>
        </section>
        <section className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold">Demo data</h2>
          <p className="text-sm text-muted-foreground">Everything is saved in this browser.</p>
          <Button variant="outline" className="mt-2" onClick={resetDemo}>Reset demo data</Button>
        </section>
      </div>
    );
  },
});

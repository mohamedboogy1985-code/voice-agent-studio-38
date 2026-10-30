import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/audit")({
  head: () => ({ meta: [
    { title: "Audit Log — OmniAgent" }, { name: "description", content: "Every request, plan step, approval and control action recorded." },
    { property: "og:title", content: "Audit Log — OmniAgent" }, { property: "og:description", content: "Searchable, exportable record of agent activity." },
  ] }),
  component: AuditPage,
});

function AuditPage() {
  const { s, t, clearAudit } = useStore();
  const [q, setQ] = useState("");
  const rows = s.audit.filter((e) => `${e.kind} ${e.detail}`.toLowerCase().includes(q.toLowerCase()));
  const exportJson = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(s.audit, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = "omniagent-audit.json"; a.click(); URL.revokeObjectURL(url);
  };
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-semibold">{t("audit")}</h1>
      <div className="flex flex-wrap gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter…" className="max-w-xs" aria-label="Filter audit log" />
        <Button variant="outline" onClick={exportJson} disabled={!s.audit.length}>Export JSON</Button>
        <Button variant="ghost" onClick={clearAudit} disabled={!s.audit.length}>Clear</Button>
      </div>
      {rows.length === 0 ? <p className="text-muted-foreground">No events yet.</p> : (
        <ul className="divide-y rounded-xl border bg-card">
          {rows.map((e) => (
            <li key={e.id} className="flex flex-wrap gap-3 p-3 text-sm">
              <time className="font-mono text-xs text-muted-foreground">{new Date(e.at).toLocaleString()}</time>
              <span className="font-mono text-xs">{e.kind}</span><span dir="auto">{e.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

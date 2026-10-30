import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStore, type Task } from "@/lib/store";

const riskClass = { low: "bg-success/15 text-success", medium: "bg-warning/20 text-warning-foreground", high: "bg-destructive/15 text-destructive" };

export function TaskCard({ task }: { task: Task }) {
  const { t, decide } = useStore();
  return (
    <article className="rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium" dir="auto">{task.input}</p>
        <Badge variant="outline" className="ms-auto">{task.status}</Badge>
      </div>
      {task.clarify && <p className="mt-2 text-sm text-muted-foreground">{t(task.clarify as never)}</p>}
      <ol className="mt-3 space-y-2">
        {task.steps.map((st, i) => (
          <li key={st.id} className="rounded-lg bg-muted/50 p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{i + 1}</span>
              <span className="font-medium">{st.summary}</span>
              <span className={`rounded px-1.5 text-xs ${riskClass[st.risk]}`}>{st.risk}</span>
              <span className="text-xs text-muted-foreground">{st.agent} · {st.runtime === "browser" ? t("browser") : t("companion")}</span>
              <Badge variant="secondary" className="ms-auto">{st.status.replace("_", " ")}</Badge>
            </div>
            {st.output && st.output !== "approved" && <p className="mt-1 text-xs text-muted-foreground" dir="auto">{st.output}</p>}
            {st.status === "awaiting_approval" && (
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => decide(task.id, st.id, true)}>{t("approve")}</Button>
                <Button size="sm" variant="outline" onClick={() => decide(task.id, st.id, false)}>{t("reject")}</Button>
                <span className="self-center font-mono text-xs text-muted-foreground">{st.tool}</span>
              </div>
            )}
          </li>
        ))}
      </ol>
    </article>
  );
}

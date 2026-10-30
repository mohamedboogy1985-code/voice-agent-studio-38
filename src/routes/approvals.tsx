import { createFileRoute } from "@tanstack/react-router";
import { TaskCard } from "@/components/TaskCard";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/approvals")({
  head: () => ({ meta: [
    { title: "Approvals — OmniAgent" }, { name: "description", content: "Review and approve risky agent actions before they run." },
    { property: "og:title", content: "Approvals — OmniAgent" }, { property: "og:description", content: "Pending confirmations for destructive or external actions." },
  ] }),
  component: () => {
    const { s, t } = useStore();
    const list = s.tasks.filter((x) => x.steps.some((p) => p.status === "awaiting_approval"));
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-semibold">{t("approvals")}</h1>
        <p className="text-sm text-muted-foreground">High-risk steps (delete, send, install, settings) and PC actions always wait here for you.</p>
        {list.length === 0 ? <p className="text-muted-foreground">{t("noApprovals")}</p> : list.map((x) => <TaskCard key={x.id} task={x} />)}
      </div>
    );
  },
});

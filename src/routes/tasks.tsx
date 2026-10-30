import { createFileRoute } from "@tanstack/react-router";
import { TaskCard } from "@/components/TaskCard";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/tasks")({
  head: () => ({ meta: [
    { title: "Tasks — OmniAgent" }, { name: "description", content: "All planned and completed agent tasks with step timelines." },
    { property: "og:title", content: "Tasks — OmniAgent" }, { property: "og:description", content: "Agent task history and progress." },
  ] }),
  component: () => {
    const { s, t } = useStore();
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-semibold">{t("tasks")}</h1>
        {s.tasks.length === 0 ? <p className="text-muted-foreground">{t("noTasks")}</p> : s.tasks.map((x) => <TaskCard key={x.id} task={x} />)}
      </div>
    );
  },
});

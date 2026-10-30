import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, type OmniAgent, type ReleaseLabel } from "@/lib/store";
import { wordDiff } from "@/lib/diff";

export const Route = createFileRoute("/agents")({
  head: () => ({ meta: [
    { title: "Agents — OmniAgent" }, { name: "description", content: "Configure specialised agents and manage Draft, Staging and Production versions." },
    { property: "og:title", content: "Agents — OmniAgent" }, { property: "og:description", content: "Agent configuration with version history and word-level diffs." },
  ] }),
  component: AgentsPage,
});

const LABELS: ReleaseLabel[] = ["draft", "staging", "production"];

function Diff({ a, b }: { a: string; b: string }) {
  return (
    <p className="whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-sm" dir="auto">
      {wordDiff(a, b).map((p, i) => p.type === "same" ? <span key={i}>{p.text}</span>
        : p.type === "add" ? <ins key={i} className="bg-success/20 no-underline">{p.text}</ins>
        : <del key={i} className="bg-destructive/15 text-destructive">{p.text}</del>)}
    </p>
  );
}

function AgentEditor({ agent }: { agent: OmniAgent }) {
  const { saveAgent, setLabel, restore } = useStore();
  const [ins, setIns] = useState(agent.instructions);
  const [greet, setGreet] = useState(agent.greeting);
  const [note, setNote] = useState("");
  const [from, setFrom] = useState(agent.versions[0].id);
  const [to, setTo] = useState(agent.versions[agent.versions.length - 1].id);
  useEffect(() => { setIns(agent.instructions); setGreet(agent.greeting); setTo(agent.versions[agent.versions.length - 1].id); }, [agent]);
  const A = agent.versions.find((v) => v.id === from) ?? agent.versions[0];
  const B = agent.versions.find((v) => v.id === to) ?? agent.versions[agent.versions.length - 1];
  const dirty = ins !== agent.instructions || greet !== agent.greeting;
  const save = () => {
    if (ins.trim().length < 10) return toast.error("Instructions must be at least 10 characters");
    if (!greet.trim()) return toast.error("Greeting is required");
    saveAgent(agent.id, ins.trim(), greet.trim(), note.trim()); setNote(""); toast.success("New draft version saved");
  };
  const tagsFor = (id: string) => LABELS.filter((l) => agent.labels[l] === id);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-3 rounded-xl border bg-card p-4">
        <h2 className="font-display text-lg font-semibold">{agent.name}</h2>
        <p className="text-sm text-muted-foreground">{agent.role}</p>
        <div className="flex flex-wrap gap-1">{agent.tools.map((x) => <Badge key={x} variant="outline" className="font-mono">{x}</Badge>)}</div>
        <div className="space-y-1"><Label htmlFor="ins">Instructions</Label><Textarea id="ins" dir="auto" rows={6} value={ins} onChange={(e) => setIns(e.target.value)} /></div>
        <div className="space-y-1"><Label htmlFor="gr">Greeting</Label><Input id="gr" dir="auto" value={greet} onChange={(e) => setGreet(e.target.value)} /></div>
        <div className="space-y-1"><Label htmlFor="nt">Change note</Label><Input id="nt" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What changed?" /></div>
        <Button onClick={save} disabled={!dirty}>Save as new draft</Button>
      </section>
      <section className="space-y-3 rounded-xl border bg-card p-4">
        <h2 className="font-display text-lg font-semibold">Version history</h2>
        <ul className="space-y-2">
          {[...agent.versions].reverse().map((v) => (
            <li key={v.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 p-2 text-sm">
              <span className="font-mono">v{v.n}</span><span className="truncate">{v.note}</span>
              {tagsFor(v.id).map((l) => <Badge key={l} className="capitalize">{l}</Badge>)}
              <div className="ms-auto flex gap-1">
                <Select onValueChange={(l) => { setLabel(agent.id, l as ReleaseLabel, v.id); toast.success(`v${v.n} → ${l}`); }}>
                  <SelectTrigger className="h-8 w-28" aria-label={`Label v${v.n}`}><SelectValue placeholder="Label…" /></SelectTrigger>
                  <SelectContent>{LABELS.map((l) => <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>)}</SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={() => { restore(agent.id, v.id); toast.success(`Restored v${v.n} as new draft`); }}>Restore</Button>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          {[[from, setFrom], [to, setTo]].map(([val, set], i) => (
            <Select key={i} value={val as string} onValueChange={set as (v: string) => void}>
              <SelectTrigger aria-label={i ? "Compare to" : "Compare from"}><SelectValue /></SelectTrigger>
              <SelectContent>{agent.versions.map((v) => <SelectItem key={v.id} value={v.id}>v{v.n}</SelectItem>)}</SelectContent>
            </Select>
          ))}
        </div>
        <Label>Instructions diff</Label><Diff a={A.instructions} b={B.instructions} />
        <Label>Greeting diff</Label><Diff a={A.greeting} b={B.greeting} />
      </section>
    </div>
  );
}

function AgentsPage() {
  const { s, t } = useStore();
  const [sel, setSel] = useState(s.agents[0].id);
  const agent = s.agents.find((a) => a.id === sel) ?? s.agents[0];
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-semibold">{t("agents")}</h1>
      <div className="flex flex-wrap gap-2" role="tablist">
        {s.agents.map((a) => <Button key={a.id} role="tab" aria-selected={a.id === sel} variant={a.id === sel ? "default" : "outline"} size="sm" onClick={() => setSel(a.id)}>{a.name}</Button>)}
      </div>
      <AgentEditor key={agent.id} agent={agent} />
    </div>
  );
}

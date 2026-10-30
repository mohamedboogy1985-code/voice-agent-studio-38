import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { Lang } from "./types";
import { dict, type TKey } from "./i18n";
import { needsApproval, planTask, type AgentKind, type PlanStep } from "./planner";

export type ReleaseLabel = "draft" | "staging" | "production";
export interface AgentVersion { id: string; n: number; instructions: string; greeting: string; note: string; at: string }
export interface OmniAgent {
  id: AgentKind; name: string; role: string; tools: string[];
  instructions: string; greeting: string;
  versions: AgentVersion[]; labels: Record<ReleaseLabel, string | null>;
}
export interface Task { id: string; input: string; lang: Lang; createdAt: string; status: "running" | "paused" | "done" | "stopped" | "needs_input"; steps: PlanStep[]; clarify?: string }
export interface AuditEvent { id: string; at: string; kind: string; detail: string }
export interface Artifact { id: string; name: string; mime: string; content: string; at: string }
export interface Device { id: string; name: string; fingerprint: string; pairedAt: string }
export interface PairingCode { code: string; expiresAt: number }

interface State {
  lang: Lang; agents: OmniAgent[]; tasks: Task[]; audit: AuditEvent[]; artifacts: Artifact[];
  devices: Device[]; pairing: PairingCode | null; paused: boolean;
}

const uid = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const now = () => new Date().toISOString();

const seedAgent = (id: AgentKind, name: string, role: string, tools: string[], instructions: string, greeting: string): OmniAgent => {
  const v: AgentVersion = { id: uid("v"), n: 1, instructions, greeting, note: "Initial sample version", at: now() };
  return { id, name, role, tools, instructions, greeting, versions: [v], labels: { draft: v.id, staging: v.id, production: v.id } };
};

const seed = (): State => ({
  lang: "en", tasks: [], audit: [], artifacts: [], devices: [], pairing: null, paused: false,
  agents: [
    seedAgent("orchestrator", "Orchestrator", "Plans, delegates, tracks progress, reports by voice", ["plan", "delegate", "report.voice_summary"],
      "You are the master orchestrator. Ask a clarifying question when the request is ambiguous. Break work into steps and delegate each step to the right agent. Always request approval for destructive or external actions.",
      "Hi, I'm your command center. What should we get done?"),
    seedAgent("desktop", "Desktop Agent", "Windows, apps, files and settings (companion)", ["windows.control", "files.manage", "settings.change", "apps.install"],
      "Control Windows only through granted scopes. Never touch system folders. Deletes go to the Recycle Bin.", "Desktop agent ready."),
    seedAgent("browser", "Browser Agent", "Research, navigation, extraction, safe downloads", ["web.research", "downloads.fetch_to_quarantine", "external.send"],
      "Research using reputable sources and cite them. Downloads always go to quarantine first.", "Browser agent ready."),
    seedAgent("artifact", "Artifact Agent", "Excel, Word, PowerPoint, PDF and code", ["artifact.create_spreadsheet", "artifact.create_document", "artifact.create_code"],
      "Produce clean, well-structured files. Keep a backup before editing existing files.", "Artifact agent ready."),
    seedAgent("builder", "Builder Agent", "New apps and workflow automations", ["builder.workflow_spec"],
      "Draft clear specifications and automation steps with triggers, actions and failure handling.", "Builder agent ready."),
  ],
});

const KEY = "omniagent.v1";

function makeArtifact(step: PlanStep, input: string): Artifact {
  const base = input.slice(0, 40).replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "task";
  if (step.tool === "artifact.create_spreadsheet")
    return { id: uid("a"), name: `${base}.csv`, mime: "text/csv", at: now(),
      content: `Item,Notes,Value\n"Request","${input.replace(/"/g, "'")}",\nSample row 1,Demo data,100\nSample row 2,Demo data,200\n` };
  if (step.tool === "artifact.create_code")
    return { id: uid("a"), name: `${base}.ts`, mime: "text/plain", at: now(), content: `// Generated for: ${input}\nexport function main() {\n  console.log("Hello from OmniAgent");\n}\n` };
  if (step.tool === "builder.workflow_spec")
    return { id: uid("a"), name: `${base}-workflow.md`, mime: "text/markdown", at: now(),
      content: `# Workflow spec\n\nRequest: ${input}\n\n## Trigger\n- Manual or schedule\n\n## Steps\n1. Collect input\n2. Process\n3. Report result\n\n## Failure handling\n- Retry once, then notify\n` };
  return { id: uid("a"), name: `${base}.md`, mime: "text/markdown", at: now(), content: `# Report\n\nRequest: ${input}\n\n_Demo content generated in the browser._\n` };
}

function speak(text: string, lang: Lang) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === "ar" ? "ar-SA" : "en-US";
  window.speechSynthesis.speak(u);
}

function useStoreValue() {
  const [s, setS] = useState<State>(seed);
  const loaded = useRef(false);
  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setS({ ...seed(), ...JSON.parse(raw) }); } catch { /* ignore */ }
    loaded.current = true;
  }, []);
  useEffect(() => { if (loaded.current) localStorage.setItem(KEY, JSON.stringify(s)); }, [s]);
  useEffect(() => {
    document.documentElement.lang = s.lang;
    document.documentElement.dir = s.lang === "ar" ? "rtl" : "ltr";
  }, [s.lang]);

  const t = useCallback((k: TKey) => dict[s.lang][k], [s.lang]);
  const log = (st: State, kind: string, detail: string): State => ({ ...st, audit: [{ id: uid("e"), at: now(), kind, detail }, ...st.audit].slice(0, 500) });

  /** Advance a task: run browser steps, gate approvals, block companion steps when no device. */
  const advance = (st: State, taskId: string): State => {
    if (st.paused) return st;
    let next = st;
    const task = next.tasks.find((x) => x.id === taskId);
    if (!task || task.status !== "running") return next;
    const steps = task.steps.map((x) => ({ ...x }));
    let artifacts = next.artifacts;
    for (const step of steps) {
      if (["done", "blocked", "rejected", "stopped"].includes(step.status)) continue;
      if (step.status === "awaiting_approval") break;
      if (step.status === "pending" && needsApproval(step) && step.output !== "approved") {
        step.status = "awaiting_approval";
        next = log(next, "approval.requested", `${step.tool} — ${step.summary}`);
        break;
      }
      if (step.runtime === "companion" && next.devices.length === 0) {
        step.status = "blocked"; step.output = "No paired Windows companion";
        next = log(next, "step.blocked", `${step.tool}: companion not paired`);
        continue;
      }
      if (step.runtime === "companion") {
        step.status = "blocked"; step.output = "Companion connection is simulated in this preview";
        next = log(next, "step.blocked", `${step.tool}: companion offline`);
        continue;
      }
      if (step.tool.startsWith("artifact.") || step.tool.startsWith("builder.")) {
        const a = makeArtifact(step, task.input);
        artifacts = [a, ...artifacts];
        step.output = `Created ${a.name}`;
      } else if (step.tool === "web.research") {
        step.output = "Demo: live web research needs the AI provider to be connected";
      } else if (step.tool === "report.voice_summary") {
        const done = steps.filter((x) => x.status === "done").length;
        const blocked = steps.filter((x) => x.status === "blocked" || x.status === "rejected").length;
        step.output = task.lang === "ar" ? `اكتملت ${done} خطوات، و${blocked} محظورة أو مرفوضة.` : `Finished ${done} steps, ${blocked} blocked or rejected.`;
        speak(step.output, task.lang);
      }
      step.status = "done";
      next = log(next, "step.done", `${step.tool}${step.output ? ": " + step.output : ""}`);
    }
    const finished = steps.every((x) => ["done", "blocked", "rejected", "stopped"].includes(x.status));
    return { ...next, artifacts, tasks: next.tasks.map((x) => (x.id === taskId ? { ...x, steps, status: finished ? "done" : x.status } : x)) };
  };

  const api = {
    s, t,
    setLang: (lang: Lang) => setS((st) => ({ ...st, lang })),
    submit: (input: string) => {
      const { steps, clarify } = planTask(input);
      const task: Task = { id: uid("t"), input, lang: /[\u0600-\u06FF]/.test(input) ? "ar" : s.lang, createdAt: now(), steps, clarify, status: clarify ? "needs_input" : "running" };
      if (clarify) { toast.info(dict[task.lang][clarify as TKey]); speak(dict[task.lang][clarify as TKey], task.lang); }
      setS((st) => advance(log({ ...st, tasks: [task, ...st.tasks] }, "task.created", input), task.id));
      return task.id;
    },
    decide: (taskId: string, stepId: string, ok: boolean) => setS((st) => {
      const step = st.tasks.find((x) => x.id === taskId)?.steps.find((x) => x.id === stepId);
      const tasks = st.tasks.map((x) => x.id !== taskId ? x : { ...x, steps: x.steps.map((p) => p.id !== stepId ? p : ok ? { ...p, status: "pending" as const, output: "approved" } : { ...p, status: "rejected" as const, output: "Rejected by you" }) });
      toast[ok ? "success" : "message"](ok ? "Approved" : "Rejected");
      return advance(log({ ...st, tasks }, ok ? "approval.granted" : "approval.rejected", step?.tool ?? stepId), taskId);
    }),
    stopAll: () => {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
      setS((st) => log({ ...st, tasks: st.tasks.map((x) => x.status === "running" || x.status === "paused" ? { ...x, status: "stopped", steps: x.steps.map((p) => ["done", "blocked", "rejected"].includes(p.status) ? p : { ...p, status: "stopped" as const }) } : x) }, "control.stop_all", "All tasks stopped"));
      toast.error("All tasks stopped");
    },
    togglePause: () => setS((st) => {
      const paused = !st.paused;
      let n = log({ ...st, paused }, paused ? "control.pause" : "control.resume", "");
      if (!paused) for (const tk of n.tasks.filter((x) => x.status === "running")) n = advance(n, tk.id);
      return n;
    }),
    saveAgent: (id: AgentKind, instructions: string, greeting: string, note: string) => setS((st) => log({
      ...st, agents: st.agents.map((a) => {
        if (a.id !== id) return a;
        const v: AgentVersion = { id: uid("v"), n: a.versions.length + 1, instructions, greeting, note: note || "Edited", at: now() };
        return { ...a, instructions, greeting, versions: [...a.versions, v], labels: { ...a.labels, draft: v.id } };
      }),
    }, "agent.version_saved", id)),
    setLabel: (id: AgentKind, label: ReleaseLabel, versionId: string) => setS((st) => log({ ...st, agents: st.agents.map((a) => a.id === id ? { ...a, labels: { ...a.labels, [label]: versionId } } : a) }, "agent.label_moved", `${id} ${label}`)),
    restore: (id: AgentKind, versionId: string) => setS((st) => log({
      ...st, agents: st.agents.map((a) => {
        const old = a.versions.find((v) => v.id === versionId);
        if (a.id !== id || !old) return a;
        const v: AgentVersion = { ...old, id: uid("v"), n: a.versions.length + 1, note: `Restored from v${old.n}`, at: now() };
        return { ...a, instructions: v.instructions, greeting: v.greeting, versions: [...a.versions, v], labels: { ...a.labels, draft: v.id } };
      }),
    }, "agent.restored", `${id} ${versionId}`)),
    newPairing: () => setS((st) => log({ ...st, pairing: { code: String(Math.floor(10000000 + Math.random() * 89999999)), expiresAt: Date.now() + 5 * 60_000 } }, "device.pairing_code_issued", "valid 5 minutes")),
    cancelPairing: () => setS((st) => ({ ...st, pairing: null })),
    revokeDevice: (id: string) => setS((st) => log({ ...st, devices: st.devices.filter((d) => d.id !== id) }, "device.revoked", id)),
    clearAudit: () => setS((st) => ({ ...st, audit: [] })),
    resetDemo: () => { setS(seed()); toast.success("Demo data reset"); },
  };
  return api;
}

type Store = ReturnType<typeof useStoreValue>;
const Ctx = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const v = useStoreValue();
  return <Ctx.Provider value={useMemo(() => v, [v])}>{children}</Ctx.Provider>;
}
export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore outside provider");
  return v;
}

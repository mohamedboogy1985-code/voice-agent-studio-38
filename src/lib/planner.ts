export type AgentKind = "orchestrator" | "desktop" | "browser" | "artifact" | "builder";
export type Risk = "low" | "medium" | "high";
export type Runtime = "browser" | "companion";
export type StepStatus = "pending" | "awaiting_approval" | "running" | "done" | "blocked" | "rejected" | "stopped";

export interface PlanStep {
  id: string;
  agent: AgentKind;
  tool: string;
  summary: string;
  risk: Risk;
  runtime: Runtime;
  status: StepStatus;
  output?: string;
}

const has = (t: string, words: string[]) => words.some((w) => t.includes(w));

const W = {
  delete: ["delete", "remove", "erase", "احذف", "حذف", "امسح"],
  send: ["send", "email", "post", "publish", "أرسل", "ارسل", "انشر"],
  install: ["install", "ثبت", "تثبيت"],
  settings: ["setting", "volume", "wifi", "wi-fi", "brightness", "display", "إعدادات", "اعدادات", "الصوت", "السطوع"],
  window: ["window", "open app", "launch", "close", "minimize", "نافذة", "افتح برنامج", "شغل"],
  file: ["file", "folder", "move", "rename", "copy", "ملف", "مجلد", "انقل"],
  research: ["research", "search", "find", "look up", "compare", "website", "ابحث", "بحث", "قارن", "موقع"],
  download: ["download", "نزّل", "نزل", "تحميل", "حمل"],
  excel: ["excel", "spreadsheet", "sheet", "csv", "table", "جدول", "إكسل", "اكسل"],
  doc: ["word", "document", "report", "pdf", "powerpoint", "slides", "presentation", "تقرير", "مستند", "عرض"],
  code: ["code", "script", "vs code", "كود", "برمجة"],
  build: ["app", "workflow", "automate", "automation", "تطبيق", "أتمتة", "اتمتة", "سير عمل"],
};

let counter = 0;
const sid = () => `s_${Date.now().toString(36)}_${(counter++).toString(36)}`;

/** Rule-based demo planner. Splits a spoken/typed request into agent steps. */
export function planTask(input: string): { steps: PlanStep[]; clarify?: string } {
  const t = input.toLowerCase().trim();
  const steps: PlanStep[] = [];
  const add = (s: Omit<PlanStep, "id" | "status">) => steps.push({ ...s, id: sid(), status: "pending" });

  if (t.length < 4) return { steps: [], clarify: "clarify_short" };

  if (has(t, W.research))
    add({ agent: "browser", tool: "web.research", summary: "Research the topic on the public web", risk: "low", runtime: "browser" });
  if (has(t, W.download))
    add({ agent: "browser", tool: "downloads.fetch_to_quarantine", summary: "Download file into quarantine and scan", risk: "medium", runtime: "companion" });
  if (has(t, W.excel))
    add({ agent: "artifact", tool: "artifact.create_spreadsheet", summary: "Create a spreadsheet (CSV) you can download", risk: "low", runtime: "browser" });
  if (has(t, W.doc))
    add({ agent: "artifact", tool: "artifact.create_document", summary: "Create a document you can download", risk: "low", runtime: "browser" });
  if (has(t, W.code))
    add({ agent: "artifact", tool: "artifact.create_code", summary: "Generate a code file", risk: "low", runtime: "browser" });
  if (has(t, W.build))
    add({ agent: "builder", tool: "builder.workflow_spec", summary: "Draft an app / workflow specification", risk: "low", runtime: "browser" });
  if (has(t, W.window))
    add({ agent: "desktop", tool: "windows.control", summary: "Open or arrange windows and apps", risk: "medium", runtime: "companion" });
  if (has(t, W.file))
    add({ agent: "desktop", tool: "files.manage", summary: "Work with files in allowed folders", risk: "medium", runtime: "companion" });
  if (has(t, W.settings))
    add({ agent: "desktop", tool: "settings.change", summary: "Change a Windows setting", risk: "high", runtime: "companion" });
  if (has(t, W.delete))
    add({ agent: "desktop", tool: "files.delete_to_recycle_bin", summary: "Delete items (to Recycle Bin)", risk: "high", runtime: "companion" });
  if (has(t, W.send))
    add({ agent: "browser", tool: "external.send", summary: "Send or publish content externally", risk: "high", runtime: "companion" });
  if (has(t, W.install))
    add({ agent: "desktop", tool: "apps.install", summary: "Install software", risk: "high", runtime: "companion" });

  if (steps.length === 0) return { steps: [], clarify: "clarify_unknown" };
  add({ agent: "orchestrator", tool: "report.voice_summary", summary: "Report results by voice", risk: "low", runtime: "browser" });
  return { steps };
}

/** High-risk steps always need explicit approval; medium needs approval when on the PC. */
export function needsApproval(step: Pick<PlanStep, "risk" | "runtime">): boolean {
  return step.risk === "high" || (step.risk === "medium" && step.runtime === "companion");
}

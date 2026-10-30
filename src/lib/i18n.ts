import type { Lang } from "./types";

const en = {
  app: "OmniAgent",
  command: "Command Center", tasks: "Tasks", approvals: "Approvals", agents: "Agents",
  devices: "Devices", audit: "Audit Log", settings: "Settings",
  say: "Say or type a task…", run: "Plan task", listen: "Speak", stopListen: "Stop listening",
  stopAll: "Stop everything", pause: "Pause", resume: "Resume",
  companionMissing: "No Windows companion paired. PC control steps will be blocked.",
  clarify_short: "Could you describe the task in a bit more detail?",
  clarify_unknown: "I'm not sure which agent should handle that. Try mentioning research, a spreadsheet, a report, files, windows or a workflow.",
  noTasks: "No tasks yet. Try: \"Research laptop prices and make a spreadsheet\".",
  noApprovals: "Nothing waiting for your approval.",
  approve: "Approve", reject: "Reject", browser: "Runs in browser", companion: "Needs Windows companion",
  language: "Language",
};
type Dict = typeof en;
const ar: Dict = {
  app: "أومني إيجنت",
  command: "مركز القيادة", tasks: "المهام", approvals: "الموافقات", agents: "الوكلاء",
  devices: "الأجهزة", audit: "سجل التدقيق", settings: "الإعدادات",
  say: "قل أو اكتب مهمة…", run: "خطط للمهمة", listen: "تحدث", stopListen: "إيقاف الاستماع",
  stopAll: "أوقف كل شيء", pause: "إيقاف مؤقت", resume: "استئناف",
  companionMissing: "لا يوجد تطبيق ويندوز مقترن. خطوات التحكم بالحاسوب ستُحظر.",
  clarify_short: "هل يمكنك وصف المهمة بتفصيل أكثر؟",
  clarify_unknown: "لست متأكداً أي وكيل يتولى ذلك. اذكر البحث أو جدول أو تقرير أو ملفات أو نوافذ أو سير عمل.",
  noTasks: "لا توجد مهام بعد. جرّب: \"ابحث عن أسعار الحواسيب وأنشئ جدول\".",
  noApprovals: "لا شيء بانتظار موافقتك.",
  approve: "موافقة", reject: "رفض", browser: "يعمل في المتصفح", companion: "يتطلب تطبيق ويندوز",
  language: "اللغة",
};
export const dict: Record<Lang, Dict> = { en, ar };
export type TKey = keyof Dict;

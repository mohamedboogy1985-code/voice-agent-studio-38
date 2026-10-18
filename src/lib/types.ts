export type Lang = "en" | "ar";
export type AgentStatus = "active" | "draft" | "archived";
export type CallStatus = "completed" | "failed" | "abandoned" | "transferred";
export type Outcome = "resolved" | "escalated" | "follow_up" | "no_resolution";

export interface Agent {
  id: string;
  name: string;
  description: string;
  instructions: string;
  greeting: string;
  language: Lang;
  voice: string;
  tone: "friendly" | "professional" | "empathetic" | "energetic";
  responseStyle: "concise" | "balanced" | "detailed";
  interruption: "allow" | "finish_sentence" | "disabled";
  tools: string[];
  knowledgeIds: string[];
  status: AgentStatus;
  sample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TranscriptLine {
  role: "agent" | "user" | "system";
  text: string;
  at: number; // seconds from start
}

export interface CallRecord {
  id: string;
  agentId: string;
  caller: string;
  status: CallStatus;
  outcome: Outcome;
  durationSec: number;
  startedAt: string;
  transcript: TranscriptLine[];
  mode: "sample" | "browser_demo";
  sample?: boolean;
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  category: string;
  content: string;
  sample?: boolean;
  updatedAt: string;
}

export interface Settings {
  workspaceName: string;
  ownerEmail: string;
  uiLanguage: Lang;
  inputDeviceHint: string;
  speechRate: number;
  speechPitch: number;
  autoListen: boolean;
}

export const TOOL_OPTIONS = [
  { id: "book_appointment", label: "Book appointment" },
  { id: "lookup_order", label: "Look up order" },
  { id: "transfer_human", label: "Transfer to human" },
  { id: "send_sms", label: "Send SMS summary" },
  { id: "create_ticket", label: "Create support ticket" },
  { id: "check_balance", label: "Check account balance" },
];

export const VOICE_OPTIONS = [
  { id: "aria", label: "Aria — warm, female" },
  { id: "noah", label: "Noah — calm, male" },
  { id: "layla", label: "Layla — clear, female (Arabic)" },
  { id: "omar", label: "Omar — deep, male (Arabic)" },
];

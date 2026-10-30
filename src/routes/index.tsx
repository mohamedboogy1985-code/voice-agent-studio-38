import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Download, Mic, MicOff, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TaskCard } from "@/components/TaskCard";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Command Center — OmniAgent" },
    { name: "description", content: "Speak Arabic or English to plan tasks across specialised AI agents." },
    { property: "og:title", content: "Command Center — OmniAgent" },
    { property: "og:description", content: "Voice-first AI command center with approvals and audit log." },
  ] }),
  component: CommandCenter,
});

type Rec = { lang: string; interimResults: boolean; start(): void; stop(): void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };

function CommandCenter() {
  const { s, t, submit } = useStore();
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const rec = useRef<Rec | null>(null);

  useEffect(() => {
    const W = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
    setSupported(!!(W.SpeechRecognition || W.webkitSpeechRecognition));
  }, []);

  const toggleMic = () => {
    if (listening) { rec.current?.stop(); return; }
    const W = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
    const C = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!C) return;
    window.speechSynthesis?.cancel(); // barge-in: stop talking when the user speaks
    const r = new C();
    r.lang = s.lang === "ar" ? "ar-SA" : "en-US";
    r.interimResults = true;
    r.onresult = (e) => setText(Array.from(e.results).map((x) => x[0].transcript).join(" "));
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    rec.current = r; r.start(); setListening(true);
  };

  const go = () => { if (!text.trim()) return; rec.current?.stop(); submit(text.trim()); setText(""); };
  const download = (name: string, mime: string, content: string) => {
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border bg-card p-6">
        <h1 className="font-display text-3xl font-semibold">{t("command")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{s.devices.length ? "" : t("companionMissing")}</p>
        <div className="mt-5 flex flex-col gap-3 md:flex-row">
          <Button type="button" onClick={toggleMic} disabled={!supported} aria-pressed={listening}
            className={`h-20 w-20 shrink-0 self-center rounded-full ${listening ? "animate-pulse bg-signal text-signal-foreground" : ""}`}
            aria-label={listening ? t("stopListen") : t("listen")}>
            {listening ? <MicOff className="size-7" /> : <Mic className="size-7" />}
          </Button>
          <Textarea dir="auto" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("say")} className="min-h-20 flex-1"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); go(); } }} aria-label={t("say")} />
          <Button onClick={go} disabled={!text.trim()} className="md:self-end"><Send />{t("run")}</Button>
        </div>
        {!supported && <p className="mt-2 text-xs text-muted-foreground">Voice input isn't supported in this browser — typing works.</p>}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold">{t("tasks")}</h2>
          {s.tasks.length === 0 ? <p className="text-sm text-muted-foreground">{t("noTasks")}</p> : s.tasks.slice(0, 3).map((x) => <TaskCard key={x.id} task={x} />)}
        </div>
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold">Files created</h2>
          {s.artifacts.length === 0 && <p className="text-sm text-muted-foreground">Spreadsheets, reports and code you ask for appear here.</p>}
          {s.artifacts.slice(0, 8).map((a) => (
            <button key={a.id} onClick={() => download(a.name, a.mime, a.content)} className="flex w-full items-center gap-2 rounded-lg border bg-card p-3 text-start text-sm hover:bg-muted">
              <Download className="size-4" /><span className="truncate">{a.name}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Laptop, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/devices")({
  head: () => ({ meta: [
    { title: "Devices — OmniAgent" }, { name: "description", content: "Pair a Windows companion and manage its permissions." },
    { property: "og:title", content: "Devices — OmniAgent" }, { property: "og:description", content: "Secure pairing for PC control." },
  ] }),
  component: DevicesPage,
});

const SCOPES = ["windows.read", "windows.control", "apps.launch", "files.read:<folder>", "files.write:<folder>", "settings.<area>", "browser.drive", "office.edit", "downloads", "shell (disabled)"];

function DevicesPage() {
  const { s, t, newPairing, cancelPairing, revokeDevice } = useStore();
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!s.pairing) return;
    const tick = () => setLeft(Math.max(0, Math.round((s.pairing!.expiresAt - Date.now()) / 1000)));
    tick(); const i = setInterval(tick, 1000); return () => clearInterval(i);
  }, [s.pairing]);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold">{t("devices")}</h1>
      <div className="rounded-xl border border-warning bg-warning/10 p-4 text-sm">
        A website can't control your PC on its own. Desktop, file, settings and in-program actions need the OmniAgent Windows companion, which isn't available to download yet. Until then those steps show as blocked.
      </div>
      <section className="rounded-xl border bg-card p-4">
        <h2 className="font-display text-lg font-semibold">Pair a PC</h2>
        {s.pairing && left > 0 ? (
          <div className="mt-3 space-y-2">
            <p className="font-mono text-4xl tracking-widest">{s.pairing.code.replace(/(\d{4})/, "$1 ")}</p>
            <p className="text-sm text-muted-foreground">Enter this code in the companion. Expires in {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}. No companion will answer in this preview.</p>
            <Button variant="outline" onClick={cancelPairing}>Cancel</Button>
          </div>
        ) : <Button className="mt-3" onClick={newPairing}><Laptop />Generate pairing code</Button>}
      </section>
      <section className="rounded-xl border bg-card p-4">
        <h2 className="font-display text-lg font-semibold">Paired devices</h2>
        {s.devices.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No devices paired.</p> : s.devices.map((d) => (
          <div key={d.id} className="mt-2 flex items-center gap-2"><span>{d.name}</span><span className="font-mono text-xs">{d.fingerprint}</span><Button size="sm" variant="outline" className="ms-auto" onClick={() => revokeDevice(d.id)}>Revoke</Button></div>
        ))}
      </section>
      <section className="rounded-xl border bg-card p-4">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><ShieldCheck className="size-5" />Permissions granted per device (all off by default)</h2>
        <div className="mt-3 flex flex-wrap gap-2">{SCOPES.map((x) => <span key={x} className="rounded-md bg-muted px-2 py-1 font-mono text-xs">{x}</span>)}</div>
        <p className="mt-3 text-sm text-muted-foreground">Downloads land in quarantine and are scanned before release. Executables and macros are blocked by default.</p>
      </section>
    </div>
  );
}

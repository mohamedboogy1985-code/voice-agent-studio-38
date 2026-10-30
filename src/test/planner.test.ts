import { describe, expect, it } from "vitest";
import { needsApproval, planTask } from "@/lib/planner";

describe("planner rules", () => {
  it("routes research + spreadsheet to browser-runnable agents", () => {
    const { steps } = planTask("Research laptop prices and make a spreadsheet");
    expect(steps.map((s) => s.tool)).toEqual(["web.research", "artifact.create_spreadsheet", "report.voice_summary"]);
    expect(steps.every((s) => s.runtime === "browser")).toBe(true);
  });
  it("marks deletes as high risk on the companion", () => {
    const d = planTask("delete old files").steps.find((s) => s.tool === "files.delete_to_recycle_bin")!;
    expect(d.risk).toBe("high");
    expect(d.runtime).toBe("companion");
  });
  it("understands Arabic", () => {
    expect(planTask("ابحث عن أسعار").steps[0].tool).toBe("web.research");
  });
  it("asks to clarify unknown requests", () => {
    expect(planTask("hello there").clarify).toBe("clarify_unknown");
  });
  it("requires approval for high risk and medium PC actions only", () => {
    expect(needsApproval({ risk: "high", runtime: "browser" })).toBe(true);
    expect(needsApproval({ risk: "medium", runtime: "companion" })).toBe(true);
    expect(needsApproval({ risk: "low", runtime: "companion" })).toBe(false);
  });
});

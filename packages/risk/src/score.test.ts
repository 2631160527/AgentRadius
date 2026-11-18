// Copyright (c) 2026 蔡宇翔. Licensed under Apache-2.0.
import { describe, expect, it } from "vitest";
import { ImpactGraph } from "../../core/src/graph.js";
import { analyzeBlastRadius } from "./score.js";

describe("analyzeBlastRadius", () => {
  it("produces a transparent score, level, recommendation, and evidence paths", () => {
    const graph = new ImpactGraph();
    graph.addEntity({ id: "file:a", type: "file", name: "a.ts" });
    graph.addEntity({ id: "table:p", type: "table", name: "payments" });
    graph.addEntity({ id: "agent:b", type: "agent", name: "Billing" });
    graph.addEdge({ from: "file:a", to: "table:p", type: "writes", confidence: 1, evidence: [{ source: "a.ts", kind: "ast" }] });
    graph.addEdge({ from: "table:p", to: "agent:b", type: "affects", confidence: 1, evidence: [{ source: "agents.yaml", kind: "metadata" }] });
    const report = analyzeBlastRadius(graph, ["file:a"]);
    expect(report.score).toBeGreaterThan(30);
    expect(report.level).toMatch(/MEDIUM|HIGH|CRITICAL/);
    expect(report.recommendation).toMatch(/WARN|BLOCK/);
    expect(report.paths.some((path) => path.map((edge) => edge.type).join(" -> ") === "writes -> affects")).toBe(true);
    expect(report.evidence.length).toBeGreaterThan(0);
  });
});


// Copyright (c) 2026 蔡宇翔. Licensed under Apache-2.0.
import { describe, expect, it } from "vitest";
import { mkdtemp, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { scanTypeScript } from "./typescript.js";

describe("scanTypeScript", () => {
  it("builds import, call, and SQL edges with AST evidence", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "agent-radius-"));
    await mkdir(path.join(root, "src"), { recursive: true });
    await writeFile(path.join(root, "src", "payment.ts"), `export function refund() { return db.query("SELECT * FROM payments"); }`);
    await writeFile(path.join(root, "src", "order.ts"), `import { refund } from './payment'; export function checkout() { return refund(); }`);
    const result = scanTypeScript(root);
    expect(result.graph.getEntity("file:src/order.ts")).toBeTruthy();
    expect(result.graph.allEdges().some((e) => e.type === "imports" && e.to.includes("payment"))).toBe(true);
    expect(result.graph.allEdges().some((e) => e.type === "calls" && e.to.includes("refund"))).toBe(true);
    expect(result.graph.allEdges().some((e) => e.type === "writes" || e.type === "reads")).toBe(true);
    expect(result.graph.allEdges().every((e) => (e.evidence?.length ?? 0) > 0)).toBe(true);
  });
});


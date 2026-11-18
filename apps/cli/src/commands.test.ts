// Copyright (c) 2026 蔡宇翔. Licensed under Apache-2.0.
import { describe, expect, it } from "vitest";
import { mkdtemp, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { runAnalyze, runExplain, runInit } from "./commands.js";

describe("CLI commands", () => {
  it("initializes and analyzes a repository", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "agent-radius-cli-"));
    await mkdir(path.join(root, "src"), { recursive: true });
    await writeFile(path.join(root, "src", "payment.ts"), `export function pay(){ return db.query("SELECT * FROM payments"); }`);
    await runInit(root);
    const report = await runAnalyze(root);
    expect(report.affected.some((entity) => entity.name === "payments")).toBe(true);
    expect((await runExplain(root, "src/payment.ts"))).toContain("payments");
  });
});


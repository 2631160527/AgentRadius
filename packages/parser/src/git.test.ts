// Copyright (c) 2026 蔡宇翔. Licensed under Apache-2.0.
import { describe, expect, it } from "vitest";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { detectGitChanges } from "./git.js";

describe("detectGitChanges", () => {
  it("reads changed files and line counts from git diff", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "agent-radius-git-"));
    execFileSync("git", ["init", "-q"], { cwd: root });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: root });
    await writeFile(path.join(root, "a.ts"), "export const a = 1;\n");
    execFileSync("git", ["add", "."], { cwd: root }); execFileSync("git", ["commit", "-qm", "init"], { cwd: root });
    await writeFile(path.join(root, "a.ts"), "export const a = 2;\nexport const b = 3;\n");
    const changes = await detectGitChanges(root);
    expect(changes).toEqual([{ path: "a.ts", status: "M", additions: 2, deletions: 1 }]);
  });
});



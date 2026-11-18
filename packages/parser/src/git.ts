// Copyright (c) 2026 蔡宇翔. Licensed under Apache-2.0.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execFile);

export interface GitChange { path: string; status: string; additions: number; deletions: number; }

export async function detectGitChanges(rootDir: string): Promise<GitChange[]> {
  try {
    const { stdout: diff } = await exec("git", ["diff", "--numstat"], { cwd: rootDir, windowsHide: true });
    const { stdout: status } = await exec("git", ["status", "--short"], { cwd: rootDir, windowsHide: true });
    const statuses = new Map<string, string>();
    for (const line of status.split(/\r?\n/)) {
      if (!line.trim()) continue;
      statuses.set(line.slice(3).trim().replaceAll("\\", "/"), line.slice(0, 2).trim() || "M");
    }
    const result: GitChange[] = [];
    for (const line of diff.split(/\r?\n/)) {
      const parts = line.split(/\s+/); if (parts.length < 3 || !parts[2]) continue;
      result.push({ path: parts.slice(2).join(" ").replaceAll("\\", "/"), status: statuses.get(parts.slice(2).join(" ")) ?? "M", additions: Number(parts[0]) || 0, deletions: Number(parts[1]) || 0 });
    }
    for (const [file, fileStatus] of statuses) if (!result.some((item) => item.path === file) && fileStatus.includes("??")) result.push({ path: file, status: "A", additions: 0, deletions: 0 });
    return result;
  } catch { return []; }
}


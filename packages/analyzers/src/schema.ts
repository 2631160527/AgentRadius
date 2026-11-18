// Copyright (c) 2026 蔡宇翔. Licensed under Apache-2.0.
import fs from "node:fs";
import path from "node:path";
export interface SchemaTable { name: string; columns: string[]; source: string; }
function walk(dir: string): string[] { const out: string[] = []; if (!fs.existsSync(dir)) return out; for (const item of fs.readdirSync(dir, { withFileTypes: true })) { const full = path.join(dir, item.name); if (item.isDirectory() && item.name !== "node_modules" && item.name !== ".git") out.push(...walk(full)); else if (item.isFile() && item.name.endsWith(".sql")) out.push(full); } return out; }
export function loadSqlSchema(rootDir: string): SchemaTable[] {
  const result: SchemaTable[] = [];
  for (const filename of walk(rootDir)) {
    const text = fs.readFileSync(filename, "utf8");
    for (const match of text.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?([A-Za-z_][\w.]*)["`]?\s*\(([^;]*?)\)\s*;/gis)) {
      const columns = match[2].split(",").map((part) => part.trim().split(/\s+/)[0]).filter((column) => /^[A-Za-z_][\w]*$/.test(column));
      result.push({ name: match[1], columns, source: path.relative(rootDir, filename).replaceAll(path.sep, "/") });
    }
  }
  return result;
}


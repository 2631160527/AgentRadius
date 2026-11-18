// Copyright (c) 2026 蔡宇翔. Licensed under Apache-2.0.
import { describe, expect, it } from "vitest";
import { mkdtemp, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { loadSqlSchema } from "./schema.js";

describe("loadSqlSchema", () => {
  it("extracts table names and columns from CREATE TABLE statements", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "agent-radius-schema-"));
    await mkdir(path.join(root, "db"), { recursive: true });
    await writeFile(path.join(root, "db", "schema.sql"), `CREATE TABLE payments (id INTEGER PRIMARY KEY, order_id TEXT);\nCREATE TABLE orders (id INTEGER);`);
    expect(loadSqlSchema(root)).toEqual([
      { name: "payments", columns: ["id", "order_id"], source: "db/schema.sql" },
      { name: "orders", columns: ["id"], source: "db/schema.sql" },
    ]);
  });
});


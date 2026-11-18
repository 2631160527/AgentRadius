// Copyright (c) 2026 蔡宇翔. Licensed under Apache-2.0.
import { describe, expect, it } from "vitest";
import { mkdtemp, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { loadAgentMetadata } from "./metadata.js";

describe("loadAgentMetadata", () => {
  it("loads agent touch patterns from yaml", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "agent-radius-meta-"));
    await mkdir(path.join(root, ".agent-radius"), { recursive: true });
    await writeFile(path.join(root, ".agent-radius", "agents.yaml"), `agents:\n  - id: billing-agent\n    name: Billing Agent\n    capabilities: [payment]\n    touches:\n      - src/payment/**\n      - db:payments\n`);
    const agents = loadAgentMetadata(root);
    expect(agents[0]).toMatchObject({ id: "billing-agent", name: "Billing Agent", touches: ["src/payment/**", "db:payments"] });
  });
});


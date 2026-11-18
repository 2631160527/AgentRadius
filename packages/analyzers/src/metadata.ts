// Copyright (c) 2026 蔡宇翔. Licensed under Apache-2.0.
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import type { ImpactGraph } from "../../core/src/graph.js";

export interface AgentMetadata { id: string; name: string; capabilities: string[]; touches: string[]; }
export function loadAgentMetadata(rootDir: string): AgentMetadata[] {
  const filename = path.join(rootDir, ".agent-radius", "agents.yaml");
  if (!fs.existsSync(filename)) return [];
  const parsed = yaml.load(fs.readFileSync(filename, "utf8")) as { agents?: unknown[] } | undefined;
  return (parsed?.agents ?? []).map((item) => {
    const value = item as Record<string, unknown>;
    return { id: String(value.id ?? ""), name: String(value.name ?? value.id ?? ""), capabilities: Array.isArray(value.capabilities) ? value.capabilities.map(String) : [], touches: Array.isArray(value.touches) ? value.touches.map(String) : [] };
  }).filter((agent) => agent.id);
}
function globToRegExp(glob: string): RegExp { return new RegExp(`^${glob.replace(/[.+^${}()|[\]\\]/g, "\\$&").replaceAll("**", "§§").replaceAll("*", "[^/]*").replaceAll("§§", ".*")}$`); }
export function connectAgentMetadata(graph: ImpactGraph, agents: AgentMetadata): void;
export function connectAgentMetadata(graph: ImpactGraph, agents: AgentMetadata[]): void;
export function connectAgentMetadata(graph: ImpactGraph, agents: AgentMetadata | AgentMetadata[]): void {
  for (const agent of Array.isArray(agents) ? agents : [agents]) {
    const id = `agent:${agent.id}`;
    graph.addEntity({ id, type: "agent", name: agent.name, metadata: { capabilities: agent.capabilities } });
    for (const pattern of agent.touches) {
      if (pattern.startsWith("db:")) {
        const tableId = `table:${pattern.slice(3)}`;
        if (graph.getEntity(tableId)) graph.addEdge({ from: tableId, to: id, type: "affects", confidence: .9, evidence: [{ source: ".agent-radius/agents.yaml", kind: "metadata", detail: `${agent.id} touches ${pattern}` }] });
        continue;
      }
      const re = globToRegExp(pattern);
      for (const entity of graph.allEntities().filter((item) => item.type === "file" && re.test(item.name))) {
        graph.addEdge({ from: entity.id, to: id, type: "affects", confidence: .9, evidence: [{ source: ".agent-radius/agents.yaml", kind: "metadata", detail: `${agent.id} touches ${pattern}` }] });
      }
    }
  }
}


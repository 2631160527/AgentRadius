// Copyright (c) 2026 蔡宇翔. Licensed under Apache-2.0.
import type { Edge, EdgeType, Entity, Evidence } from "../../core/src/model.js";
import type { ImpactGraph, TraversalNode } from "../../core/src/graph.js";

export interface RiskRule { edgeType: EdgeType; weight: number; }
export interface BlastRadiusReport {
  changed: Entity[];
  affected: Entity[];
  score: number;
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  recommendation: "ALLOW" | "WARN" | "BLOCK";
  paths: Edge[][];
  evidence: Evidence[];
  reasons: string[];
}
const DEFAULT_RULES: RiskRule[] = [
  { edgeType: "contains", weight: .2 }, { edgeType: "imports", weight: .6 }, { edgeType: "calls", weight: .9 },
  { edgeType: "reads", weight: .5 }, { edgeType: "writes", weight: 1 }, { edgeType: "depends_on", weight: .8 },
  { edgeType: "exposes", weight: .8 }, { edgeType: "calls_api", weight: 1 }, { edgeType: "owned_by", weight: .4 },
  { edgeType: "affects", weight: .9 }, { edgeType: "triggers", weight: .9 },
];
const entityBonus: Record<string, number> = { table: 12, database: 12, agent: 14, external: 18, api: 13, service: 8, symbol: 3, file: 2 };
export function analyzeBlastRadius(graph: ImpactGraph, changedIds: string[], options: { maxDepth?: number; rules?: RiskRule[] } = {}): BlastRadiusReport {
  const changed = changedIds.map((id) => graph.getEntity(id)).filter((x): x is Entity => Boolean(x));
  const traversal = graph.traverse(changedIds, options.maxDepth ?? 4);
  const weights = new Map((options.rules ?? DEFAULT_RULES).map((rule) => [rule.edgeType, rule.weight]));
  let raw = changed.length * 8;
  const paths: Edge[][] = [];
  const evidence: Evidence[] = [];
  const reasons: string[] = [];
  for (const node of traversal) {
    if (node.depth === 0) continue;
    const edgeWeight = node.path.reduce((sum, edge) => sum + (weights.get(edge.type) ?? .3), 0);
    const depthFactor = 1 / Math.max(1, node.depth);
    raw += edgeWeight * 16 * depthFactor + (entityBonus[node.entity.type] ?? 2) * depthFactor;
    paths.push(node.path);
    for (const edge of node.path) for (const item of edge.evidence ?? []) if (!evidence.some((x) => x.source === item.source && x.location === item.location && x.detail === item.detail)) evidence.push(item);
    const last = node.path[node.path.length - 1];
    reasons.push(`${last.type}: ${graph.getEntity(last.from)?.name ?? last.from} -> ${node.entity.name}`);
  }
  const score = Math.round(Math.min(100, raw));
  const level = score >= 80 ? "CRITICAL" : score >= 60 ? "HIGH" : score >= 30 ? "MEDIUM" : "LOW";
  const recommendation = score >= 80 ? "BLOCK" : score >= 30 ? "WARN" : "ALLOW";
  return { changed, affected: traversal.map((item) => item.entity), score, level, recommendation, paths, evidence, reasons };
}


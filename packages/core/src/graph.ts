// Copyright (c) 2026 蔡宇翔. Licensed under Apache-2.0.
import type { Edge, Entity } from "./model.js";

export interface TraversalNode {
  entity: Entity;
  depth: number;
  path: Edge[];
}

export class ImpactGraph {
  private readonly entities = new Map<string, Entity>();
  private readonly edges = new Map<string, Edge>();

  addEntity(entity: Entity): Entity {
    const existing = this.entities.get(entity.id);
    if (existing) return existing;
    this.entities.set(entity.id, entity);
    return entity;
  }

  addEdge(edge: Edge): Edge {
    if (!this.entities.has(edge.from) || !this.entities.has(edge.to)) {
      throw new Error(`Cannot add edge with unknown entity: ${edge.from} -> ${edge.to}`);
    }
    const key = `${edge.from}|${edge.type}|${edge.to}`;
    const existing = this.edges.get(key);
    if (!existing) {
      this.edges.set(key, { ...edge, evidence: edge.evidence ? [...edge.evidence] : [] });
      return edge;
    }
    const evidence = [...(existing.evidence ?? [])];
    for (const item of edge.evidence ?? []) {
      if (!evidence.some((x) => x.source === item.source && x.kind === item.kind && x.location === item.location && x.detail === item.detail)) evidence.push(item);
    }
    existing.confidence = Math.max(existing.confidence, edge.confidence);
    existing.evidence = evidence;
    return existing;
  }

  getEntity(id: string): Entity | undefined { return this.entities.get(id); }
  outgoing(id: string): Edge[] { return [...this.edges.values()].filter((edge) => edge.from === id); }
  incoming(id: string): Edge[] { return [...this.edges.values()].filter((edge) => edge.to === id); }
  allEntities(): Entity[] { return [...this.entities.values()]; }
  allEdges(): Edge[] { return [...this.edges.values()]; }

  traverse(startIds: string[], maxDepth = 3): TraversalNode[] {
    const result: TraversalNode[] = [];
    const seen = new Set<string>();
    const queue: TraversalNode[] = [];
    for (const id of startIds) {
      const entity = this.entities.get(id);
      if (entity && !seen.has(id)) { seen.add(id); queue.push({ entity, depth: 0, path: [] }); }
    }
    while (queue.length) {
      const current = queue.shift()!;
      result.push(current);
      if (current.depth >= maxDepth) continue;
      for (const edge of this.outgoing(current.entity.id)) {
        if (seen.has(edge.to)) continue;
        const entity = this.entities.get(edge.to);
        if (!entity) continue;
        seen.add(edge.to);
        queue.push({ entity, depth: current.depth + 1, path: [...current.path, edge] });
      }
    }
    return result;
  }
}


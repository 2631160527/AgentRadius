// Copyright (c) 2026 蔡宇翔. Licensed under Apache-2.0.
import { describe, expect, it } from "vitest";
import { ImpactGraph } from "./graph.js";
import type { Entity, Edge } from "./model.js";

describe("ImpactGraph", () => {
  it("deduplicates entities and edges while preserving evidence", () => {
    const graph = new ImpactGraph();
    const file: Entity = { id: "file:src/a.ts", type: "file", name: "src/a.ts" };
    const symbol: Entity = { id: "symbol:A", type: "symbol", name: "A" };
    const edge: Edge = { from: file.id, to: symbol.id, type: "contains", confidence: 1, evidence: [{ source: "a.ts:1", kind: "ast" }] };
    graph.addEntity(file); graph.addEntity(file); graph.addEntity(symbol);
    graph.addEdge(edge); graph.addEdge({ ...edge, evidence: [{ source: "a.ts:2", kind: "ast" }] });
    expect(graph.allEntities()).toHaveLength(2);
    expect(graph.allEdges()).toHaveLength(1);
    expect(graph.allEdges()[0].evidence).toHaveLength(2);
  });

  it("traverses outgoing relationships with depth and path", () => {
    const graph = new ImpactGraph();
    for (const id of ["file:a", "service:b", "database:c"]) graph.addEntity({ id, type: id.startsWith("file") ? "file" : id.startsWith("service") ? "service" : "database", name: id });
    graph.addEdge({ from: "file:a", to: "service:b", type: "depends_on", confidence: .9 });
    graph.addEdge({ from: "service:b", to: "database:c", type: "writes", confidence: 1 });
    const result = graph.traverse(["file:a"], 3);
    expect(result.map((x) => [x.entity.id, x.depth])).toEqual([["file:a", 0], ["service:b", 1], ["database:c", 2]]);
    expect(result[2].path).toHaveLength(2);
  });
});

type _Entity = Entity;


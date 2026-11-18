// Copyright (c) 2026 蔡宇翔. Licensed under Apache-2.0.
export type EntityType =
  | "file" | "symbol" | "service" | "database" | "table"
  | "api" | "agent" | "external";

export type EdgeType =
  | "contains" | "imports" | "calls" | "reads" | "writes"
  | "depends_on" | "exposes" | "calls_api" | "owned_by"
  | "affects" | "triggers";

export type EvidenceKind = "ast" | "git" | "config" | "schema" | "openapi" | "metadata" | "inference";

export interface Evidence {
  source: string;
  kind: EvidenceKind;
  location?: string;
  detail?: string;
}

export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  metadata?: Record<string, unknown>;
}

export interface Edge {
  from: string;
  to: string;
  type: EdgeType;
  confidence: number;
  evidence?: Evidence[];
}


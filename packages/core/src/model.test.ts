// Copyright (c) 2026 蔡宇翔. Licensed under Apache-2.0.
import { describe, expect, it } from "vitest";
import type { EntityType, EdgeType } from "./model.js";

describe("domain model", () => {
  it("exposes the supported entity and edge vocabulary", () => {
    const entity: EntityType = "agent";
    const edge: EdgeType = "triggers";
    expect(entity).toBe("agent"); expect(edge).toBe("triggers");
  });
});


# Agent Radius MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dependency-aware, evidence-preserving Agent Radius MVP that analyzes TypeScript repositories and reports explainable blast radius and risk from Git diffs or agent actions.

**Architecture:** A small TypeScript workspace with a reusable core library and a CLI. The scanner reads Git status/diff, TypeScript source, SQL schema, and `.agent-radius/agents.yaml`, then builds an in-memory directed graph whose edges carry evidence. A transparent weighted traversal produces affected entities, score, level, recommendation, and human/JSON explanations.

**Tech Stack:** Node.js 20+, TypeScript, tsx, Vitest, Commander, TypeScript Compiler API, js-yaml, simple-git-free (CLI git fallback is also supported).

**Spec:** `C:/Users/蔡宇翔/Downloads/Agent_Radius_MVP_Spec.md`

## Global Constraints

- MVP supports TypeScript/JavaScript first and does not require an LLM or paid API.
- Every important relationship preserves AST, Git, schema, config, metadata, or inference evidence.
- Risk is an explainable impact heuristic, not a probability claim.
- No Web UI, cloud SaaS, orchestration, permission system, or automatic code modification.
- CLI must run locally with `agent-radius init`, `analyze`, `explain`, `graph`, and `check`.
- Copyright uses Apache-2.0 plus copyright/NOTICE files and repository hygiene guidance.

---

### Task 1: Workspace and domain model

**Files:**
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `pnpm-workspace.yaml`
- Create: `packages/core/src/model.ts`, `packages/core/src/graph.ts`, `packages/core/src/index.ts`
- Test: `packages/core/src/model.test.ts`, `packages/core/src/graph.test.ts`

**Interfaces:**
- `EntityType`, `EdgeType`, `Evidence`, `Entity`, `Edge`
- `ImpactGraph.addEntity`, `addEdge`, `getEntity`, `outgoing`, `incoming`, `allEntities`, `allEdges`
- `ImpactGraph.traverse(startIds, maxDepth)` returns nodes with depth and path edges

- [ ] Write tests for graph entity/edge deduplication and BFS traversal with evidence.
- [ ] Run `pnpm test -- packages/core/src/model.test.ts packages/core/src/graph.test.ts`; confirm it fails because files are absent.
- [ ] Implement the minimal model and graph.
- [ ] Re-run focused tests and then all tests.

### Task 2: TypeScript repository scanner

**Files:**
- Create: `packages/parser/src/typescript.ts`, `packages/parser/src/git.ts`, `packages/parser/src/index.ts`
- Test: `packages/parser/src/typescript.test.ts`, `packages/parser/src/git.test.ts`

**Interfaces:**
- `scanTypeScript(rootDir): ScanResult` with entities and edges
- `detectGitChanges(rootDir): Promise<GitChange[]>`
- `GitChange { path, status, additions, deletions }`

- [ ] Add failing tests for relative imports, function/method calls, SQL table references, and Git diff parsing.
- [ ] Run focused tests and confirm expected failures.
- [ ] Implement TypeScript Compiler API scanning for files, imports, declarations, calls, and common SQL/ORM table patterns; attach source locations.
- [ ] Implement Git CLI parsing for `git diff --numstat` and `git status --short`, with graceful empty result outside a Git repo.
- [ ] Run focused and full tests.

### Task 3: Metadata and database loaders

**Files:**
- Create: `packages/analyzers/src/metadata.ts`, `packages/analyzers/src/schema.ts`, `packages/analyzers/src/index.ts`
- Test: `packages/analyzers/src/metadata.test.ts`, `packages/analyzers/src/schema.test.ts`

**Interfaces:**
- `loadAgentMetadata(rootDir): AgentMetadata[]`
- `loadSqlSchema(rootDir): SchemaTable[]`
- `connectMetadata(graph, agents, tables): void`

- [ ] Write failing tests for YAML agent touch globs and SQL CREATE TABLE parsing.
- [ ] Implement loaders using js-yaml and line-based SQL parsing.
- [ ] Connect file/table nodes to agents and schema evidence.
- [ ] Run all tests.

### Task 4: Blast radius and risk scoring

**Files:**
- Create: `packages/risk/src/score.ts`, `packages/risk/src/index.ts`
- Test: `packages/risk/src/score.test.ts`

**Interfaces:**
- `RiskRule { edgeType, weight }`
- `analyzeBlastRadius(graph, changedIds, options?): BlastRadiusReport`
- Report includes affected entities, paths, score 0-100, level LOW/MEDIUM/HIGH/CRITICAL, recommendation ALLOW/WARN/BLOCK, and evidence.

- [ ] Write failing tests for weighted traversal, score normalization, and recommendation thresholds.
- [ ] Implement configurable edge weights and depth-aware accumulation.
- [ ] Ensure direct changes and database/external/agent edges increase score transparently.
- [ ] Run tests.

### Task 5: CLI commands

**Files:**
- Create: `apps/cli/src/main.ts`, `apps/cli/src/commands.ts`, `apps/cli/bin/agent-radius.mjs`
- Modify: root `package.json`
- Test: `apps/cli/src/commands.test.ts`

**Interfaces:**
- `runAnalyze(rootDir, options): Promise<BlastRadiusReport>`
- `runExplain(rootDir, target): Promise<string>`
- `runGraph(rootDir): Promise<string>`
- `runCheck(rootDir, actionFile, json): Promise<string | object>`

- [ ] Add failing CLI tests for `init`, `analyze`, `explain`, and JSON `check` against a temp fixture.
- [ ] Implement Commander commands and stable text/JSON output with nonzero exit for BLOCK.
- [ ] Verify `pnpm agent-radius --help` and fixture execution.

### Task 6: Demo, docs, and copyright

**Files:**
- Create: `examples/demo-project/src/order/order.ts`, `examples/demo-project/src/payment/payment.ts`, `examples/demo-project/src/shipping/shipping.ts`, `examples/demo-project/db/schema.sql`, `examples/demo-project/.agent-radius/agents.yaml`, `examples/demo-project/external/stripe.yaml`
- Create: `README.md`, `LICENSE`, `NOTICE`, `CONTRIBUTING.md`, `SECURITY.md`, `docs/prior-art.md`, `.github/ISSUE_TEMPLATE/bug_report.md`, `.github/PULL_REQUEST_TEMPLATE.md`
- Modify: source files with copyright header where appropriate

- [ ] Add an end-to-end demo whose diff reaches services, tables, agents, and Stripe evidence.
- [ ] Document installation, CLI examples, heuristic limitations, benchmark direction, and copyright ownership.
- [ ] Add Apache-2.0 license with the user’s copyright holder placeholder set to `蔡宇翔` and current year.
- [ ] Add repository protection checklist for GitHub settings.

### Task 7: Verification and GitHub publication

**Files:**
- Modify: package lockfile and generated artifacts only as needed.

- [ ] Run `pnpm test`, `pnpm build`, and real demo commands from a clean checkout state.
- [ ] Run secret scan over tracked files and inspect `git diff --check`.
- [ ] Initialize Git history with a clear commit and set remote to `https://github.com/2631160527/AgentRadius.git`.
- [ ] Push to the user’s GitHub repository if credentials are available; otherwise leave an exact one-command push instruction and state the blocker.
- [ ] Report files, verification evidence, publication status, and GitHub anti-copying measures.

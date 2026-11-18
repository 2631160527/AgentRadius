// Copyright (c) 2026 蔡宇翔. Licensed under Apache-2.0.
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { scanTypeScript, detectGitChanges } from "../../../packages/parser/src/index.js";
import { loadAgentMetadata, connectAgentMetadata, loadSqlSchema } from "../../../packages/analyzers/src/index.js";
import { analyzeBlastRadius, type BlastRadiusReport } from "../../../packages/risk/src/index.js";
import type { Entity } from "../../../packages/core/src/model.js";

export interface AnalyzeOptions { changedIds?: string[]; maxDepth?: number; }
function normalize(value: string): string { return value.replaceAll("\\", "/").replace(/^\.\//, ""); }
function entityIdForTarget(root: string, target: string): string { const relative = normalize(path.relative(root, path.resolve(root, target))); return `file:${relative}`; }
function attachSchema(graph: ReturnType<typeof scanTypeScript>["graph"], root: string): void {
  for (const table of loadSqlSchema(root)) {
    const id = `table:${table.name}`;
    graph.addEntity({ id, type: "table", name: table.name, metadata: { columns: table.columns, schema: table.source } });
  }
}
function attachExternal(graph: ReturnType<typeof scanTypeScript>["graph"], root: string): void {
  const directory = path.join(root, "external"); if (!fs.existsSync(directory)) return;
  for (const filename of fs.readdirSync(directory).filter((name) => /\.(yaml|yml)$/.test(name))) {
    const source = `external/${filename}`;
    const value = yaml.load(fs.readFileSync(path.join(directory, filename), "utf8")) as Record<string, unknown>;
    const name = String(value?.name ?? path.basename(filename, path.extname(filename)));
    const id = `external:${name}`; graph.addEntity({ id, type: "external", name, metadata: value });
    const touches = Array.isArray(value?.touches) ? value.touches.map(String) : [];
    for (const touch of touches) {
      const target = touch.startsWith("db:") ? `table:${touch.slice(3)}` : touch.startsWith("file:") ? touch : `file:${normalize(touch)}`;
      if (graph.getEntity(target)) graph.addEdge({ from: target, to: id, type: "calls_api", confidence: .8, evidence: [{ source, kind: "config", detail: `external system touched by ${touch}` }] });
    }
  }
}
function buildGraph(root: string) {
  const result = scanTypeScript(root); attachSchema(result.graph, root); connectAgentMetadata(result.graph, loadAgentMetadata(root)); attachExternal(result.graph, root); return result.graph;
}
export async function runInit(rootDir: string): Promise<void> {
  const directory = path.join(rootDir, ".agent-radius"); fs.mkdirSync(directory, { recursive: true });
  const config = path.join(directory, "config.yaml"); const agents = path.join(directory, "agents.yaml");
  if (!fs.existsSync(config)) fs.writeFileSync(config, "version: 1\nmaxDepth: 4\n");
  if (!fs.existsSync(agents)) fs.writeFileSync(agents, "agents: []\n");
}
export async function runAnalyze(rootDir: string, options: AnalyzeOptions = {}): Promise<BlastRadiusReport> {
  const root = path.resolve(rootDir); const graph = buildGraph(root);
  let changedIds = options.changedIds;
  if (!changedIds) {
    const changes = await detectGitChanges(root);
    changedIds = changes.map((change) => `file:${normalize(change.path)}`).filter((id) => graph.getEntity(id));
  }
  if (!changedIds?.length) changedIds = graph.allEntities().filter((entity) => entity.type === "file").map((entity) => entity.id);
  return analyzeBlastRadius(graph, changedIds, { maxDepth: options.maxDepth });
}
export function formatReport(report: BlastRadiusReport): string {
  const lines = [`BLAST RADIUS: ${report.level}`, `SCORE: ${report.score}/100`, `RECOMMENDATION: ${report.recommendation}`, "", "Changed:", ...report.changed.map((entity) => `  ${entity.name}`), "", "Affected:", ...report.affected.filter((entity) => !report.changed.some((item) => item.id === entity.id)).map((entity) => `  ${entity.type}: ${entity.name}`), "", "Why:", ...report.reasons.slice(0, 12).map((reason) => `  ${reason}`), "", "Evidence:", ...report.evidence.slice(0, 12).map((item) => `  [${item.kind}] ${item.source}${item.location ? ` (${item.location})` : ""}`)]; return lines.join("\n");
}
export async function runExplain(rootDir: string, target: string): Promise<string> {
  const root = path.resolve(rootDir); const id = entityIdForTarget(root, target); const report = await runAnalyze(root, { changedIds: [id] });
  const lines = [`Impact path for ${target}`, `Risk: ${report.level} (${report.score}/100)`, ""];
  for (const pathEdges of report.paths) {
    if (!pathEdges.length) continue;
    const first = report.changed[0]?.name ?? target; const chain = [first, ...pathEdges.map((edge) => report.affected.find((entity) => entity.id === edge.to)?.name ?? edge.to)];
    lines.push(`  ${chain.join(" -> ")}`);
  }
  if (report.evidence.length) { lines.push("", "Evidence:"); for (const item of report.evidence) lines.push(`  [${item.kind}] ${item.source}${item.detail ? ` — ${item.detail}` : ""}`); }
  return lines.join("\n");
}
export async function runGraph(rootDir: string): Promise<string> { const graph = buildGraph(path.resolve(rootDir)); return graph.allEdges().map((edge) => `${graph.getEntity(edge.from)?.name ?? edge.from} -[${edge.type}]-> ${graph.getEntity(edge.to)?.name ?? edge.to} [${edge.evidence?.[0]?.kind ?? "unknown"}]`).join("\n"); }
export async function runCheck(rootDir: string, actionFile: string, json = false): Promise<string | BlastRadiusReport> {
  const action = JSON.parse(fs.readFileSync(path.resolve(rootDir, actionFile), "utf8")) as { target?: string };
  const report = await runAnalyze(rootDir, { changedIds: action.target ? [entityIdForTarget(path.resolve(rootDir), action.target)] : undefined });
  return json ? report : formatReport(report);
}


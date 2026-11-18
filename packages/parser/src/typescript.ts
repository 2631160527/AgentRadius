// Copyright (c) 2026 蔡宇翔. Licensed under Apache-2.0.
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { ImpactGraph } from "../../core/src/graph.js";
import type { Edge, Entity } from "../../core/src/model.js";

export interface ScanResult { graph: ImpactGraph; files: string[]; }

function walk(root: string, dir = root): string[] {
  const result: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(root, full));
    else if (/\.(ts|tsx|js|jsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) result.push(full);
  }
  return result;
}

function rel(root: string, filename: string): string { return path.relative(root, filename).replaceAll(path.sep, "/"); }
function fileId(relative: string): string { return `file:${relative}`; }
function symbolId(relative: string, name: string): string { return `symbol:${relative}#${name}`; }
function evidence(source: string, node: ts.Node, detail: string): Edge["evidence"] { return [{ source, kind: "ast", location: `${node.getSourceFile().fileName}:${node.getStart() + 1}`, detail }]; }
function resolveModule(root: string, from: string, moduleName: string): string | undefined {
  if (!moduleName.startsWith(".")) return undefined;
  const base = path.resolve(path.dirname(from), moduleName);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, path.join(base, "index.ts")]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return undefined;
}

export function scanTypeScript(rootDir: string): ScanResult {
  const root = path.resolve(rootDir);
  const filenames = walk(root);
  const graph = new ImpactGraph();
  const sources = new Map<string, ts.SourceFile>();
  const symbolNames = new Map<string, string>();
  for (const filename of filenames) {
    const relative = rel(root, filename);
    const source = ts.createSourceFile(filename, fs.readFileSync(filename, "utf8"), ts.ScriptTarget.Latest, true);
    sources.set(filename, source);
    graph.addEntity({ id: fileId(relative), type: "file", name: relative, metadata: { absolutePath: filename } });
    const declarations: ts.Node[] = [];
    const visit = (node: ts.Node) => {
      if (ts.isFunctionDeclaration(node) && node.name) declarations.push(node);
      else if (ts.isClassDeclaration(node) && node.name) declarations.push(node);
      else if (ts.isVariableStatement(node)) declarations.push(...node.declarationList.declarations.filter((d) => ts.isIdentifier(d.name)));
      ts.forEachChild(node, visit);
    };
    visit(source);
    for (const node of declarations) {
      const name = ts.isVariableStatement(node) ? (node.declarationList.declarations[0].name as ts.Identifier).text : ((node as ts.FunctionDeclaration | ts.ClassDeclaration).name?.text ?? "");
      if (!name) continue;
      const id = symbolId(relative, name); symbolNames.set(name, id);
      graph.addEntity({ id, type: "symbol", name, metadata: { file: relative } });
      graph.addEdge({ from: fileId(relative), to: id, type: "contains", confidence: 1, evidence: evidence(relative, node, `declares ${name}`) });
    }
  }
  for (const [filename, source] of sources) {
    const relative = rel(root, filename);
    const fileEntity = fileId(relative);
    const visit = (node: ts.Node, currentCaller?: string) => {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const resolved = resolveModule(root, filename, node.moduleSpecifier.text);
        if (resolved) {
          const targetRel = rel(root, resolved);
          const named = node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings) ? node.importClause.namedBindings.elements : [];
          if (named.length) for (const item of named) {
            const target = symbolId(targetRel, (item.propertyName ?? item.name).text);
            graph.addEntity({ id: target, type: "symbol", name: (item.propertyName ?? item.name).text, metadata: { file: targetRel } });
            graph.addEdge({ from: fileEntity, to: target, type: "imports", confidence: .95, evidence: evidence(relative, node, `imports ${(item.propertyName ?? item.name).text}`) });
          }
          else graph.addEdge({ from: fileEntity, to: fileId(targetRel), type: "imports", confidence: .95, evidence: evidence(relative, node, `imports ${targetRel}`) });
        }
      }
      let caller = currentCaller;
      if (ts.isFunctionDeclaration(node) && node.name) caller = symbolId(relative, node.name.text);
      if (ts.isCallExpression(node)) {
        const called = ts.isIdentifier(node.expression) ? node.expression.text : ts.isPropertyAccessExpression(node.expression) ? node.expression.name.text : undefined;
        const target = called ? symbolNames.get(called) : undefined;
        if (target) graph.addEdge({ from: caller ?? fileEntity, to: target, type: "calls", confidence: .85, evidence: evidence(relative, node, `calls ${called}`) });
      }
      ts.forEachChild(node, (child) => visit(child, caller));
    };
    visit(source);
    const text = source.getFullText();
    const sql = /\b(SELECT\s+[^;]*?\s+FROM|INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+["'`]?([A-Za-z_][\w.]*)/gi;
    for (const match of text.matchAll(sql)) {
      const tableName = match[2]; if (!tableName) continue;
      const tableId = `table:${tableName}`;
      graph.addEntity({ id: tableId, type: "table", name: tableName });
      const operation = match[1].toUpperCase();
      const type = operation.startsWith("SELECT") ? "reads" : "writes";
      graph.addEdge({ from: fileEntity, to: tableId, type, confidence: .8, evidence: [{ source: relative, kind: "ast", location: `${relative}:${text.slice(0, match.index ?? 0).split("\n").length}`, detail: operation }] });
    }
  }
  return { graph, files: filenames.map((f) => rel(root, f)) };
}


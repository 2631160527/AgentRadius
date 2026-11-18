// Copyright (c) 2026 蔡宇翔. Licensed under Apache-2.0.
import { Command } from "commander";
import path from "node:path";
import { formatReport, runAnalyze, runCheck, runExplain, runGraph, runInit } from "./commands.js";
export async function main(argv = process.argv): Promise<void> {
  const program = new Command().name("agent-radius").description("Explainable blast radius analysis for agent actions");
  program.command("init").description("Create .agent-radius configuration").action(async () => { await runInit(process.cwd()); console.log("Created .agent-radius/config.yaml and agents.yaml"); });
  program.command("analyze").option("--json", "machine-readable output").action(async (options) => { const report = await runAnalyze(process.cwd()); console.log(options.json ? JSON.stringify(report, null, 2) : formatReport(report)); });
  program.command("explain <target>").action(async (target) => console.log(await runExplain(process.cwd(), target)));
  program.command("graph").action(async () => console.log(await runGraph(process.cwd())));
  program.command("check").requiredOption("--action <file>").option("--json", "machine-readable output").action(async (options) => { const result = await runCheck(process.cwd(), options.action, options.json); if (typeof result === "string") console.log(result); else console.log(JSON.stringify(result, null, 2)); if (typeof result !== "string" && result.recommendation === "BLOCK") process.exitCode = 2; });
  await program.parseAsync(argv);
}
if (process.argv[1] && path.basename(process.argv[1]).startsWith("main")) main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });


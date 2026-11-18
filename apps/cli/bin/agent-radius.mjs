#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
const entry = path.resolve(new URL("../..", import.meta.url).pathname, "dist/apps/cli/src/main.js");
const child = spawn(process.execPath, [entry, ...process.argv.slice(2)], { stdio: "inherit" });
child.on("exit", (code) => process.exitCode = code ?? 1);

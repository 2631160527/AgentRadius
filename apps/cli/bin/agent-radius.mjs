#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const entry = path.join(root, "dist", "apps", "cli", "src", "main.js");
const child = spawn(process.execPath, [entry, ...process.argv.slice(2)], { stdio: "inherit" });
child.on("exit", (code) => process.exitCode = code ?? 1);

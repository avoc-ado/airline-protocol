import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const logDir = path.join(process.cwd(), "logs");
const logPath = path.join(logDir, "test-it-real.log");

await mkdir(logDir, { recursive: true });

const logStream = createWriteStream(logPath, { flags: "w" });

const child = spawn("corepack yarn test:all", {
  env: process.env,
  shell: true
});

child.stdout.on("data", (chunk) => {
  process.stdout.write(chunk);
  logStream.write(chunk);
});

child.stderr.on("data", (chunk) => {
  process.stderr.write(chunk);
  logStream.write(chunk);
});

const exitCode = await new Promise((resolve) => {
  child.on("exit", (code) => resolve(code ?? 1));
});

logStream.end();

if (exitCode !== 0) {
  console.error(`test:it:real failed. Logs saved to ${logPath}`);
  process.exit(exitCode);
}

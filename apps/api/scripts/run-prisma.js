const { spawn } = require("child_process");
const path = require("path");
const { PROJECT_ROOT, loadRootEnv } = require("./load-root-env");

const SCHEMA_PATH = path.join(PROJECT_ROOT, "prisma/schema.prisma");
const API_ROOT = path.join(PROJECT_ROOT, "apps/api");

loadRootEnv();

const args = process.argv.slice(2);
if (!args.length) {
  console.error("Usage: node apps/api/scripts/run-prisma.js <prisma-command> [...args]");
  process.exit(1);
}

const prismaArgs = [...args, "--schema", SCHEMA_PATH];
const child = spawn("prisma", prismaArgs, {
  cwd: API_ROOT,
  env: process.env,
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});

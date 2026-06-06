const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { PROJECT_ROOT, loadRootEnv } = require("./load-root-env");

loadRootEnv();

const CRAWLER_DIR = path.join(PROJECT_ROOT, "services/crawler");

function datasetRootPath() {
  const inputPath = process.argv[2] || process.env.CRAWL_DATASET_PATH || process.env.CRAWLER_OUTPUT_DIR;
  if (!inputPath) {
    throw new Error("Pass a dataset root path as argv[2], CRAWL_DATASET_PATH, or CRAWLER_OUTPUT_DIR.");
  }
  return path.resolve(PROJECT_ROOT, inputPath);
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: PROJECT_ROOT,
      env: process.env,
      stdio: "inherit",
      ...options,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

async function main() {
  const rootPath = datasetRootPath();
  fs.mkdirSync(rootPath, { recursive: true });
  process.env.CRAWLER_OUTPUT_DIR = rootPath;

  console.log(`Dataset root: ${rootPath}`);
  await runCommand("python", ["crawler.py"], { cwd: CRAWLER_DIR });
  await runCommand("node", ["apps/api/scripts/import-crawl-dataset.js", rootPath]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

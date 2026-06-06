const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");

function loadRootEnv() {
  loadDotEnv(path.join(PROJECT_ROOT, ".env"));
  normalizeHostDatabaseUrl();
}

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function normalizeHostDatabaseUrl() {
  if (!process.env.DATABASE_URL || isDockerRuntime()) return;

  const url = new URL(process.env.DATABASE_URL);
  if (url.hostname !== "db") return;

  url.hostname = process.env.PG_HOST || "localhost";
  url.port = process.env.PG_PORT || "5432";
  process.env.DATABASE_URL = url.toString();
}

function isDockerRuntime() {
  return fs.existsSync("/.dockerenv") || process.env.RUNNING_IN_DOCKER === "true";
}

module.exports = {
  PROJECT_ROOT,
  loadRootEnv,
};

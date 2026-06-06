const { spawn } = require("child_process");
const https = require("https");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { PROJECT_ROOT, loadRootEnv } = require("./load-root-env");

const CRAWLER_DIR = path.join(PROJECT_ROOT, "services/crawler");

loadRootEnv();

const prisma = new PrismaClient();
const JOB_NAME = process.env.CRAWLER_IMPORT_JOB || "crawl_job_game_data_import";
const DUE_DAYS = Number(process.env.CRAWLER_DUE_DAYS || 42);

function defaultNsSiteUrl() {
  return "https://" + ["gi", "na" + "no" + "ka", "cc"].join(".");
}

function defaultNsStaticBaseUrl() {
  return "https://" + ["static", "na" + "no" + "ka", "cc"].join(".");
}

function envValue(name, fallback) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : fallback;
}

function requestText(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        timeout: Number(process.env.CRAWLER_TIMEOUT_SECONDS || 15) * 1000,
        headers: {
          "User-Agent": process.env.CRAWLER_USER_AGENT || "IrminsulCrawler/0.2",
        },
      },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(new Error(`GET ${url} failed with HTTP ${response.statusCode}`));
            return;
          }
          resolve(body);
        });
      },
    );

    request.on("timeout", () => {
      request.destroy(new Error(`GET ${url} timed out`));
    });
    request.on("error", reject);
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function discoverCurrentSourceVersion() {
  const siteUrl = envValue("NS_SITE_URL", defaultNsSiteUrl()).replace(/\/+$/, "") + "/";
  const staticBaseUrl = envValue(
    "NS_STATIC_BASE_URL",
    envValue("NS_BASE_URL", defaultNsStaticBaseUrl()),
  ).replace(/\/+$/, "");

  const html = await requestText(siteUrl);
  const pattern = new RegExp(`${escapeRegExp(staticBaseUrl)}/gi/([^/]+)/character\\.json`);
  const match = html.match(pattern);
  if (!match) {
    throw new Error("Could not discover current NS GI version from the site HTML.");
  }

  return match[1];
}

async function getLastRun() {
  return prisma.crawlRun.findFirst({
    where: { job: JOB_NAME },
    orderBy: { fetchedAt: "desc" },
  });
}

function getStoredSourceVersion(crawlRun) {
  if (!crawlRun || !crawlRun.sourceVersions || typeof crawlRun.sourceVersions !== "object") {
    return null;
  }
  return crawlRun.sourceVersions.ns || null;
}

function daysBetween(from, to) {
  return (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
}

function datasetRootPath() {
  return path.resolve(CRAWLER_DIR, process.env.CRAWLER_OUTPUT_DIR || "data/raw");
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

async function runCrawlAndImport() {
  await runCommand("python", ["crawler.py"], { cwd: CRAWLER_DIR });
  await runCommand("node", ["apps/api/scripts/import-crawl-dataset.js", datasetRootPath()]);
}

async function main() {
  const force = process.argv.includes("--force") || process.env.CRAWLER_FORCE === "true";
  const now = new Date();
  const [lastRun, currentVersion] = await Promise.all([
    getLastRun(),
    discoverCurrentSourceVersion(),
  ]);

  const lastVersion = getStoredSourceVersion(lastRun);
  const ageDays = lastRun ? daysBetween(lastRun.fetchedAt, now) : Infinity;
  const versionChanged = Boolean(lastVersion && currentVersion !== lastVersion);
  const ageDue = ageDays >= DUE_DAYS;
  const shouldRun = force || !lastRun || versionChanged || ageDue;

  console.log(
    JSON.stringify(
      {
        job: JOB_NAME,
        shouldRun,
        reason: force
          ? "forced"
          : !lastRun
            ? "no_previous_run"
            : versionChanged
              ? "source_version_changed"
              : ageDue
                ? "age_threshold_reached"
                : "not_due",
        currentVersion,
        lastVersion,
        lastFetchedAt: lastRun?.fetchedAt || null,
        ageDays: Number.isFinite(ageDays) ? Number(ageDays.toFixed(2)) : null,
        dueDays: DUE_DAYS,
      },
      null,
      2,
    ),
  );

  if (!shouldRun) return;
  await runCrawlAndImport();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

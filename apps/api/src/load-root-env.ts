import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export function loadRootEnv() {
  const envPath = join(__dirname, '../../../.env');

  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();

    if (key && process.env[key] === undefined) {
      process.env[key] = rawValue.replace(/^["']|["']$/g, '');
    }
  }

  normalizeLocalDatabaseUrl();
}

function normalizeLocalDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl || process.env.IRMINSUL_KEEP_DOCKER_DB_HOST === 'true') {
    return;
  }

  try {
    const url = new URL(databaseUrl);

    if (url.hostname === 'db') {
      url.hostname = '127.0.0.1';
      url.port ||= '5432';
      process.env.DATABASE_URL = url.toString();
    }
  } catch {
    return;
  }
}

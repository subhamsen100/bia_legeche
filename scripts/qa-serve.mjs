// Shared helper for tests/e2e/run.mjs and scripts/lighthouse.mjs:
// production build into a scratch dir (never dist/) + `vite preview` on a fixed port.
//
// Env:
//   QA_OUT      output dir for the build, screenshots and reports (default: $TMPDIR/invite-qa)
//   QA_PORT     preview port (default 5207, the qa-perf-agent port)
//   QA_NO_BUILD=1  reuse an existing build in $QA_OUT/dist
//   QA_BASE_URL    test an already running server instead (skips build + serve)
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('..', import.meta.url));
export const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
export const PORT = Number(process.env.QA_PORT || 5207);
export const OUT = process.env.QA_OUT || join(tmpdir(), 'invite-qa');

export function build(outDir = join(OUT, 'dist')) {
  mkdirSync(OUT, { recursive: true });
  const t = Date.now();
  const r = spawnSync('npx', ['vite', 'build', '--outDir', outDir, '--emptyOutDir'], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
  });
  const log = `${r.stdout || ''}${r.stderr || ''}`;
  if (r.status !== 0) {
    console.error(log);
    throw new Error(`vite build failed (exit ${r.status})`);
  }
  const warnings = log
    .split('\n')
    .filter((l) => /warn|\[plugin|duplicate|larger than|deprecated/i.test(l))
    .map((l) => l.trim());
  return { outDir, log, warnings, ms: Date.now() - t };
}

async function waitForHttp(url, timeoutMs = 20000) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`server at ${url} did not come up within ${timeoutMs}ms`);
}

/** Build (unless QA_NO_BUILD / QA_BASE_URL) and serve. Returns { baseUrl, build, stop() }. */
export async function buildAndServe({ label = 'qa' } = {}) {
  if (process.env.QA_BASE_URL) {
    const baseUrl = process.env.QA_BASE_URL.replace(/\/$/, '');
    await waitForHttp(baseUrl + '/');
    return { baseUrl, build: null, stop: async () => {} };
  }
  const outDir = join(OUT, 'dist');
  let b = null;
  if (process.env.QA_NO_BUILD === '1' && existsSync(join(outDir, 'index.html'))) {
    console.log(`[${label}] reusing build in ${outDir}`);
  } else {
    console.log(`[${label}] building into ${outDir} ...`);
    b = build(outDir);
    console.log(`[${label}] built in ${b.ms}ms${b.warnings.length ? `, ${b.warnings.length} warning line(s)` : ''}`);
  }
  const baseUrl = `http://localhost:${PORT}`;
  try {
    await fetch(baseUrl + '/');
    throw new Error(`port ${PORT} is already in use; stop it first (fuser -k ${PORT}/tcp) or set QA_BASE_URL`);
  } catch (e) {
    if (String(e.message).startsWith('port ')) throw e;
  }
  const child = spawn('npx', ['vite', 'preview', '--outDir', outDir, '--port', String(PORT), '--strictPort'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
    env: { ...process.env, FORCE_COLOR: '0' },
  });
  let serverLog = '';
  child.stdout.on('data', (d) => (serverLog += d));
  child.stderr.on('data', (d) => (serverLog += d));
  const stop = async () => {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      /* already gone */
    }
  };
  process.on('exit', () => {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      /* ignore */
    }
  });
  try {
    await waitForHttp(baseUrl + '/');
  } catch (e) {
    await stop();
    console.error(serverLog);
    throw e;
  }
  console.log(`[${label}] serving ${outDir} at ${baseUrl}`);
  return { baseUrl, build: b, stop };
}

// Lighthouse (mobile preset: Moto G-class emulation + simulated slow 4G) against the production build.
//
//   npm run lighthouse                       build into $QA_OUT/dist, serve on :5207, audit, stop
//   QA_OUT=/dir / QA_NO_BUILD=1 / QA_BASE_URL=http://host:port   (see scripts/qa-serve.mjs)
//   QA_LH_RUNS=3     number of runs; the median performance run is reported (default 3)
//   QA_LH_MIN_PERF=90  failure threshold for performance (default 90)
//
// Prints performance / accessibility / best-practices / SEO, the key metrics and the top
// opportunities, writes $QA_OUT/lighthouse.json + lighthouse.html, exits 1 if performance < threshold.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { buildAndServe, CHROME, OUT } from './qa-serve.mjs';

const RUNS = Math.max(1, Number(process.env.QA_LH_RUNS || 3));
const MIN_PERF = Number(process.env.QA_LH_MIN_PERF || 90);
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];

const server = await buildAndServe({ label: 'lighthouse' });
let chrome;
let exitCode = 0;
try {
  chrome = await chromeLauncher.launch({
    chromePath: CHROME,
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--no-first-run'],
  });
  const runs = [];
  for (let i = 0; i < RUNS; i++) {
    const r = await lighthouse(
      server.baseUrl + '/',
      { port: chrome.port, output: ['json', 'html'], logLevel: 'error', onlyCategories: CATEGORIES },
      // default config = mobile form factor + simulated throttling
    );
    const score = (k) => Math.round((r.lhr.categories[k]?.score ?? 0) * 100);
    console.log(`run ${i + 1}/${RUNS}: ` + CATEGORIES.map((k) => `${k} ${score(k)}`).join(', '));
    runs.push(r);
  }
  runs.sort((a, b) => a.lhr.categories.performance.score - b.lhr.categories.performance.score);
  const median = runs[Math.floor(runs.length / 2)];
  const { lhr } = median;
  writeFileSync(join(OUT, 'lighthouse.json'), median.report[0]);
  writeFileSync(join(OUT, 'lighthouse.html'), median.report[1]);

  const scores = Object.fromEntries(CATEGORIES.map((k) => [k, Math.round(lhr.categories[k].score * 100)]));
  const a = lhr.audits;
  const metric = (id) => a[id]?.displayValue ?? 'n/a';
  console.log(`\nLighthouse ${lhr.lighthouseVersion} (${lhr.configSettings.formFactor}, ${lhr.configSettings.throttlingMethod}) median of ${RUNS}:`);
  for (const k of CATEGORIES) console.log(`  ${k.padEnd(15)} ${scores[k]}`);
  console.log(
    `  FCP ${metric('first-contentful-paint')} | LCP ${metric('largest-contentful-paint')} | TBT ${metric('total-blocking-time')} | ` +
      `CLS ${metric('cumulative-layout-shift')} | SI ${metric('speed-index')}`,
  );
  const failing = Object.values(a)
    .filter((x) => x.score !== null && x.score < 0.9 && x.scoreDisplayMode !== 'informative' && x.scoreDisplayMode !== 'notApplicable' && x.scoreDisplayMode !== 'manual')
    .map((x) => `  - [${x.score}] ${x.id}: ${x.title}${x.displayValue ? ` (${x.displayValue})` : ''}`);
  if (failing.length) console.log(`\nAudits below 0.9:\n${failing.join('\n')}`);
  const perfOk = scores.performance >= MIN_PERF;
  console.log(`\n${perfOk ? 'PASS' : 'FAIL'}  performance ${scores.performance} (threshold ${MIN_PERF})`);
  console.log(`Reports: ${join(OUT, 'lighthouse.html')} and lighthouse.json`);
  writeFileSync(join(OUT, 'lighthouse-summary.json'), JSON.stringify({ scores, runs: runs.map((r) => Math.round(r.lhr.categories.performance.score * 100)), failing }, null, 2));
  if (!perfOk) exitCode = 1;
} catch (e) {
  console.error('lighthouse run failed:', e);
  exitCode = 1;
} finally {
  if (chrome) {
    try {
      await chrome.kill();
    } catch {
      /* already gone */
    }
  }
  await server.stop();
}
process.exit(exitCode);

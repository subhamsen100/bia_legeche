// Orchestrator throwaway: walk the real app flow and screenshot each scene. Deleted after Phase 4.
import { chromium } from 'playwright-core';
const [, , out, w, h, lang = '', reduced = ''] = process.argv;
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
const ctx = await b.newContext({ viewport: { width: +w, height: +h }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
const p = await ctx.newPage();
const errs = [];
p.on('console', (m) => ['error', 'warning'].includes(m.type()) && errs.push(m.type() + ': ' + m.text()));
p.on('pageerror', (e) => errs.push(String(e)));
if (lang) await p.addInitScript((l) => localStorage.setItem('invite.lang', l), lang);
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
const metrics = async (name) => {
  const m = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, iw: innerWidth, ih: innerHeight }));
  await p.screenshot({ path: `${out}-${name}.png` });
  console.log(name, JSON.stringify(m));
};
await metrics('0gate');
await p.mouse.click(+w / 2, +h / 2);
const names = ['1opening', '2names', '3family', '4message', '5date', '6venue', '7closing'];
for (let i = 0; i < names.length; i++) {
  await p.waitForTimeout(i === 4 ? 9000 : names[i] === '6venue' ? 7000 : 5500);
  await metrics(names[i]);
  await p.mouse.click(+w / 2, 100);
}
await p.waitForTimeout(4500);
await metrics('8final');
await p.screenshot({ path: `${out}-8final-full.png`, fullPage: true });
console.log('errors', errs);
await b.close();

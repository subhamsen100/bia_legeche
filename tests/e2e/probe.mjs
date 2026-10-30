// In-page probes for tests/e2e/run.mjs. Each export is a plain function that Playwright serialises
// into the page with page.evaluate(fn, arg), so it must be self-contained (no closures over module scope).

/**
 * Layout / typography / contrast probe.
 * arg: { rootSel, fitViewport (bool: text must sit inside the viewport vertically too) }
 */
export function layoutProbe({ rootSel, fitViewport }) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const de = document.documentElement;
  const out = {
    vw,
    vh,
    scrollWidth: Math.max(de.scrollWidth, document.body.scrollWidth),
    scrollHeight: Math.max(de.scrollHeight, document.body.scrollHeight),
    htmlOverflow: getComputedStyle(de).overflowY,
    bodyOverflow: getComputedStyle(document.body).overflowY,
    scrollY: window.scrollY,
    rootFound: false,
    rootScroll: null,
    textCount: 0,
    hiddenText: 0,
    outOfView: [],
    clipped: [],
    controlOverlaps: [],
    decorOverlaps: [],
    bnTypography: [],
    contrast: [], // computed against solid background colours: reliable
    contrastApprox: [], // a gradient/image background is in the chain: verify on the screenshot
    gradientText: 0,
  };
  const root = (rootSel && document.querySelector(rootSel)) || null;
  out.rootFound = Boolean(root);
  const scope = root || document.body;
  if (root) out.rootScroll = { scrollH: root.scrollHeight, clientH: root.clientHeight, scrollW: root.scrollWidth, clientW: root.clientWidth };

  // ---- colour helpers (canvas normalises any CSS colour syntax to RGBA) ----
  const cv = document.createElement('canvas');
  cv.width = cv.height = 1;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const cache = new Map();
  function rgba(c) {
    if (cache.has(c)) return cache.get(c);
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#000';
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    const v = [d[0], d[1], d[2], d[3] / 255];
    cache.set(c, v);
    return v;
  }
  const over = (top, bottom) => {
    const a = top[3];
    return [0, 1, 2].map((i) => top[i] * a + bottom[i] * (1 - a)).concat(1);
  };
  const lum = ([r, g, b]) => {
    const f = (x) => {
      x /= 255;
      return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  };
  const hex = (c) => '#' + c.slice(0, 3).map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');

  function opacityChain(el) {
    let o = 1;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
    return o;
  }
  function backgroundOf(el) {
    const chain = [];
    let approx = false;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      chain.push(cs.backgroundColor);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') approx = true;
      if (rgba(cs.backgroundColor)[3] >= 0.999) break;
    }
    let bg = [255, 255, 255, 1];
    for (let i = chain.length - 1; i >= 0; i--) bg = over(rgba(chain[i]), bg);
    return { bg, approx };
  }
  const describe = (el) => {
    const cls = typeof el.className === 'string' ? el.className.split(/\s+/)[0] : '';
    return `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}`;
  };
  const isVisuallyHidden = (el) => {
    const r = el.getBoundingClientRect();
    return r.width <= 1 && r.height <= 1;
  };

  // ---- control + decor rectangles ----
  const controls = [
    ...document.querySelectorAll('[role="radiogroup"], [data-no-skip][aria-pressed], [data-timeline-progress]'),
  ]
    .filter((c) => !scope.contains(c) || c === scope)
    .map((c) => ({ name: c.getAttribute('aria-label') || describe(c), r: c.getBoundingClientRect() }))
    .filter((c) => c.r.width > 0);
  const decor = [...document.querySelectorAll('[aria-hidden="true"]')]
    .filter((d) => getComputedStyle(d).position === 'fixed')
    .map((d) => ({ name: describe(d), r: d.getBoundingClientRect() }))
    .filter((d) => d.r.width > 0 && d.r.width * d.r.height < 0.5 * vw * vh);
  const inter = (a, b) => {
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    return w > 0 && h > 0 ? w * h : 0;
  };

  // ---- text elements = parents of non-empty text nodes ----
  const byParent = new Map();
  const tw = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
  for (let t = tw.nextNode(); t; t = tw.nextNode()) {
    if (!t.nodeValue.trim()) continue;
    const p = t.parentElement;
    if (!p || p.closest('script,style,noscript,svg,title')) continue;
    if (!byParent.has(p)) byParent.set(p, []);
    byParent.get(p).push(t);
  }
  const range = document.createRange();
  for (const [el, nodes] of byParent) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || isVisuallyHidden(el)) continue;
    let r = null;
    for (const t of nodes) {
      range.selectNodeContents(t);
      for (const q of range.getClientRects()) {
        if (q.width === 0 && q.height === 0) continue;
        r = r
          ? { left: Math.min(r.left, q.left), top: Math.min(r.top, q.top), right: Math.max(r.right, q.right), bottom: Math.max(r.bottom, q.bottom) }
          : { left: q.left, top: q.top, right: q.right, bottom: q.bottom };
      }
    }
    if (!r) continue;
    const op = opacityChain(el);
    const text = nodes.map((n) => n.nodeValue).join('').trim().replace(/\s+/g, ' ').slice(0, 48);
    if (op < 0.5) {
      out.hiddenText += 1;
      continue;
    }
    out.textCount += 1;
    const lang = el.closest('[lang]')?.getAttribute('lang') || '';
    const who = `${describe(el)} "${text}"`;

    // viewport containment
    const tol = 1.5;
    if (r.left < -tol || r.right > vw + tol || (fitViewport && (r.top < -tol || r.bottom > vh + tol))) {
      out.outOfView.push({ who, lang, rect: [r.left, r.top, r.right, r.bottom].map(Math.round) });
    }
    // clipping by overflow:hidden/clip ancestors (and by itself)
    for (let a = el; a && a !== document.documentElement; a = a.parentElement) {
      const acs = getComputedStyle(a);
      const clipX = acs.overflowX !== 'visible';
      const clipY = acs.overflowY !== 'visible';
      if (!clipX && !clipY) continue;
      if (a === document.body) break;
      const ar = a.getBoundingClientRect();
      const bx = clipX && (r.left < ar.left - tol || r.right > ar.right + tol);
      const by = clipY && (r.top < ar.top - tol || r.bottom > ar.bottom + tol);
      if (bx || by) {
        out.clipped.push({ who, lang, by: describe(a), axis: bx && by ? 'xy' : bx ? 'x' : 'y', over: Math.round(Math.max(ar.left - r.left, r.right - ar.right, ar.top - r.top, r.bottom - ar.bottom)) });
        break;
      }
    }
    if (cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1) {
      out.clipped.push({ who, lang, by: 'text-overflow:ellipsis', axis: 'x', over: el.scrollWidth - el.clientWidth });
    }
    // overlaps with fixed controls / corner decor
    const area = (r.right - r.left) * (r.bottom - r.top);
    for (const c of controls) {
      const a = inter(r, c.r);
      if (a > 4) out.controlOverlaps.push({ who, control: c.name, px2: Math.round(a) });
    }
    for (const d of decor) {
      const a = inter(r, d.r);
      if (a > 0.15 * area && a > 30) out.decorOverlaps.push({ who, decor: d.name, pct: Math.round((100 * a) / area) });
    }
    // Bengali typography rules
    if (lang === 'bn' && /[ঀ-৿]/.test(text)) {
      const fs = parseFloat(cs.fontSize);
      const lh = cs.lineHeight === 'normal' ? NaN : parseFloat(cs.lineHeight);
      const problems = [];
      if (!(lh / fs >= 1.69)) problems.push(`line-height ${cs.lineHeight} / ${cs.fontSize} = ${(lh / fs).toFixed(2)}`);
      if (cs.letterSpacing !== 'normal' && parseFloat(cs.letterSpacing) !== 0) problems.push(`letter-spacing ${cs.letterSpacing}`);
      if (cs.textTransform !== 'none') problems.push(`text-transform ${cs.textTransform}`);
      if (problems.length) out.bnTypography.push({ who, problems });
    }
    // contrast
    const fillTransparent = (cs.webkitTextFillColor && rgba(cs.webkitTextFillColor)[3] === 0) || /text/.test(cs.backgroundClip || cs.webkitBackgroundClip || '');
    if (fillTransparent) {
      out.gradientText += 1;
      continue;
    }
    const { bg, approx } = backgroundOf(el);
    const fgRaw = rgba(cs.color);
    const fg = over([fgRaw[0], fgRaw[1], fgRaw[2], fgRaw[3] * op], bg);
    const cr = ratio(fg, bg);
    const fsPx = parseFloat(cs.fontSize);
    const large = fsPx >= 24 || (fsPx >= 18.66 && Number(cs.fontWeight) >= 700);
    const need = large ? 3 : 4.5;
    if (cr < need) (approx ? out.contrastApprox : out.contrast).push({ who, lang, ratio: Number(cr.toFixed(2)), need, fg: hex(fg), bg: hex(bg), fontSize: cs.fontSize, opacity: Number(op.toFixed(2)), approxBg: approx });
  }
  return out;
}

/** Accessibility basics over the whole document. */
export function a11yProbe() {
  const out = { unnamedControls: [], imgNoAlt: [], brokenImgs: [], unhiddenSvgs: [], unhiddenFixedDecor: [], mains: 0, nestedMain: false, h1: 0 };
  const name = (el) => {
    const lbl = el.getAttribute('aria-label');
    if (lbl && lbl.trim()) return lbl.trim();
    const by = el.getAttribute('aria-labelledby');
    if (by) {
      const t = by.split(/\s+/).map((id) => document.getElementById(id)?.textContent || '').join(' ').trim();
      if (t) return t;
    }
    const t = (el.innerText || el.textContent || '').trim();
    if (t) return t;
    const img = el.querySelector('img[alt]');
    return img ? img.alt : '';
  };
  const desc = (el) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(/\s+/)[0] : ''}`;
  for (const el of document.querySelectorAll('button, a[href], [role="button"], [role="radio"], [role="link"], input, select, textarea, [role="progressbar"], [role="img"], [tabindex="0"]')) {
    if (el.closest('[aria-hidden="true"]')) continue;
    if (!name(el)) out.unnamedControls.push(desc(el));
  }
  for (const img of document.querySelectorAll('img')) {
    if (!img.hasAttribute('alt')) out.imgNoAlt.push(img.currentSrc || img.src);
    if (img.complete && img.naturalWidth === 0 && getComputedStyle(img).display !== 'none' && Number(getComputedStyle(img).opacity) > 0) out.brokenImgs.push(img.src);
  }
  for (const svg of document.querySelectorAll('svg')) {
    if (svg.closest('[aria-hidden="true"]')) continue;
    const r = svg.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const role = svg.getAttribute('role') || svg.parentElement?.getAttribute('role');
    if (role === 'img' && (svg.getAttribute('aria-label') || svg.parentElement?.getAttribute('aria-label'))) continue;
    out.unhiddenSvgs.push(`${desc(svg.parentElement || svg)} > svg`);
  }
  for (const el of document.body.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (cs.position !== 'fixed') continue;
    if (el.closest('[aria-hidden="true"]')) continue;
    if (el.querySelector('button, a, [role], input') || el.matches('button, a, [role]')) continue;
    if (!(el.textContent || '').trim()) out.unhiddenFixedDecor.push(desc(el));
  }
  const mains = document.querySelectorAll('main, [role="main"]');
  out.mains = mains.length;
  out.nestedMain = [...mains].some((m) => m.parentElement && m.parentElement.closest('main, [role="main"]'));
  out.h1 = document.querySelectorAll('h1').length;
  return out;
}

/** Running animations that loop forever (for the reduced-motion check). */
export function infiniteAnimations() {
  return document
    .getAnimations()
    .filter((a) => {
      const t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : null;
      return t && t.iterations === Infinity && a.playState === 'running' && Number(t.duration) > 50;
    })
    .map((a) => {
      const tgt = a.effect.target;
      const cls = tgt && typeof tgt.className === 'string' ? tgt.className.split(/\s+/)[0] : tgt?.tagName;
      return `${a.animationName || a.id || 'waapi'} on ${cls}`;
    });
}

/** Heart marker state inside `sel` (default: the calendar's marked cell). */
export function heartProbe(sel) {
  const cell = document.querySelector(sel || '[data-marked-date]');
  if (!cell) return { found: false };
  const heart = cell.querySelector('[data-heart-marker]');
  const pulse = heart && heart.firstElementChild;
  const cs = pulse ? getComputedStyle(pulse) : null;
  const paths = heart ? [...heart.querySelectorAll('path')].map((p) => getComputedStyle(p).animationName) : [];
  const hr = heart?.getBoundingClientRect();
  // clipping of the heart by overflow ancestors
  let clippedBy = null;
  if (heart) {
    for (let a = heart.parentElement; a && a !== document.body; a = a.parentElement) {
      const acs = getComputedStyle(a);
      if (acs.overflowX === 'visible' && acs.overflowY === 'visible') continue;
      const ar = a.getBoundingClientRect();
      if (hr.left < ar.left - 1 || hr.right > ar.right + 1 || hr.top < ar.top - 1 || hr.bottom > ar.bottom + 1) {
        clippedBy = `${a.tagName.toLowerCase()}.${String(a.className).split(/\s+/)[0]}`;
        break;
      }
    }
  }
  // neighbouring date numbers that the heart outline (incl. its 1.12 blink scale) covers
  const neighbourOverlap = [];
  if (hr) {
    const pr = heart.querySelector('path').getBoundingClientRect(); // outer stroke path, current transform
    const m = /matrix\(([^,]+)/.exec(getComputedStyle(heart.firstElementChild).transform || '');
    const cur = m ? Number(m[1]) || 1 : 1;
    const k = 1.12 / cur;
    const cx = (pr.left + pr.right) / 2;
    const cy = (pr.top + pr.bottom) / 2;
    const box = { left: cx - (pr.width * k) / 2, right: cx + (pr.width * k) / 2, top: cy - (pr.height * k) / 2, bottom: cy + (pr.height * k) / 2 };
    const grid = cell.closest('[role="grid"]') || cell.parentElement;
    for (const other of grid.querySelectorAll('[data-day]')) {
      if (other === cell) continue;
      const n = other.querySelector('[lang]') || other;
      const range = document.createRange();
      range.selectNodeContents(n);
      const r = range.getBoundingClientRect();
      const w = Math.min(r.right, box.right) - Math.max(r.left, box.left);
      const h = Math.min(r.bottom, box.bottom) - Math.max(r.top, box.top);
      if (w > 1 && h > 1) neighbourOverlap.push({ day: other.dataset.day, px: Math.round(w) });
    }
  }
  const numEls = [...cell.querySelectorAll('[lang]')].filter((e) => !e.closest('[data-heart-marker]'));
  return {
    found: true,
    hasHeart: Boolean(heart),
    ariaLabel: cell.getAttribute('aria-label'),
    heartAriaHidden: heart?.getAttribute('aria-hidden'),
    state: heart?.getAttribute('data-state'),
    period: Number(heart?.getAttribute('data-blink-period-ms')),
    animationName: cs?.animationName,
    animationDuration: cs?.animationDuration,
    iteration: cs?.animationIterationCount,
    timing: cs?.animationTimingFunction,
    transform: cs?.transform,
    opacity: cs?.opacity,
    pathAnimations: paths,
    rect: hr ? [hr.width, hr.height].map(Math.round) : null,
    cellRect: (() => {
      const r = cell.getBoundingClientRect();
      return [r.width, r.height].map(Math.round);
    })(),
    clippedBy,
    neighbourOverlap,
    numbers: numEls.map((e) => ({ lang: e.getAttribute('lang'), text: e.textContent.trim(), fontSize: getComputedStyle(e).fontSize })),
  };
}

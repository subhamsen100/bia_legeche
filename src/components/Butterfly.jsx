import { memo, useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useReducedMotionConfig } from 'framer-motion';
import styles from './Butterfly.module.css';

const SIZE = 30; // px wingspan (box is SIZE x SIZE, body bottom ~ SIZE*0.9)
const PALETTES = [
  { up: '#F2A900', low: '#EC7E12', edge: '#7A1F2B', dot: '#FFF8EC' },
  { up: '#C2546C', low: '#E995A5', edge: '#4E121B', dot: '#F8C94D' },
];

function Wing({ p, side }) {
  return (
    <span className={`${styles.wing} ${side === 'l' ? styles.left : styles.right}`}>
      <svg viewBox="0 0 20 30" focusable="false">
        <path d="M0 13C3 3 13-1 18.5 3.5C22 8 17 14.5 0 15Z" fill={p.up} stroke={p.edge} strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M0 15C9 15 15.5 18.5 14 24.5C12.5 29 4.5 27.5 0 17Z" fill={p.low} stroke={p.edge} strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M2 12Q8 6 15 5" fill="none" stroke={p.edge} strokeWidth=".5" opacity=".5" />
        <circle cx="15.5" cy="5.6" r="1.3" fill={p.dot} />
        <circle cx="18" cy="8.4" r=".8" fill={p.dot} />
        <circle cx="10" cy="23.5" r="1.1" fill={p.dot} />
      </svg>
    </span>
  );
}

const rand = (a, b) => a + Math.random() * (b - a);
const wait = (ms, alive) =>
  new Promise((res) => {
    const t = setTimeout(res, ms);
    alive.timers.push(t);
  });

function visiblePerches() {
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  return Array.from(document.querySelectorAll('[data-perch]'))
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter(({ r }) => r.width > 24 && r.top > 48 && r.top < vh - 24 && r.left > -4 && r.right < vw + 4);
}

function Flyer({ palette, startDelay }) {
  const x = useMotionValue(-80);
  const y = useMotionValue(200);
  const rotate = useMotionValue(0);
  const [mode, setMode] = useState('fly');
  const box = useRef(null);

  useEffect(() => {
    const alive = { on: true, timers: [], anims: [] };
    const fly = (tx, ty, dur) => {
      const x0 = x.get();
      const y0 = y.get();
      const mx = (x0 + tx) / 2 + rand(-90, 90);
      const my = Math.min(y0, ty) - rand(30, 110);
      const xs = [x0, mx + rand(-30, 30), tx];
      const ys = [y0, my, ty];
      rotate.set(Math.max(-24, Math.min(24, (tx - x0) * 0.06)));
      const opts = { duration: dur, ease: 'easeInOut', times: [0, 0.5, 1] };
      const a = animate(x, xs, opts);
      const b = animate(y, ys, opts);
      alive.anims.push(a, b);
      return Promise.all([a, b]);
    };

    const run = async () => {
      y.set(rand(window.innerHeight * 0.2, window.innerHeight * 0.6));
      await wait(startDelay, alive);
      while (alive.on) {
        if (document.hidden) {
          await wait(1000, alive);
          continue;
        }
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const perches = visiblePerches();
        setMode('fly');
        if (perches.length) {
          const { el, r } = perches[Math.floor(Math.random() * perches.length)];
          const offX = rand(0.15, 0.85);
          const tx = r.left + r.width * offX - SIZE / 2;
          await fly(tx, r.top - SIZE * 0.9, rand(2.6, 3.6));
          if (!alive.on) return;
          rotate.set(rand(-8, 8));
          setMode('perch');
          // stay glued to the element while perched (scroll / layout changes)
          const stick = () => {
            const rr = el.getBoundingClientRect();
            x.set(rr.left + rr.width * offX - SIZE / 2);
            y.set(rr.top - SIZE * 0.9);
          };
          window.addEventListener('scroll', stick, { passive: true });
          window.addEventListener('resize', stick);
          await wait(rand(3200, 5200), alive);
          window.removeEventListener('scroll', stick);
          window.removeEventListener('resize', stick);
          if (!alive.on) return;
          setMode('fly');
        } else {
          // nothing to land on: drift through the scene
          await fly(rand(vw * 0.2, vw * 0.8), rand(vh * 0.2, vh * 0.7), rand(3, 4));
          if (!alive.on) return;
        }
        const exitLeft = Math.random() < 0.5;
        await fly(exitLeft ? -SIZE * 3 : vw + SIZE * 2, rand(vh * 0.05, vh * 0.5), rand(2.4, 3.2));
        if (!alive.on) return;
        await wait(rand(4000, 7000), alive);
      }
    };
    run();
    return () => {
      alive.on = false;
      alive.timers.forEach(clearTimeout);
      alive.anims.forEach((a) => a.stop());
    };
  }, [x, y, rotate, startDelay]);

  return (
    <motion.div ref={box} className={styles.flyer} style={{ x, y, rotate }} data-mode={mode}>
      <span className={`${styles.body} ${mode === 'perch' ? styles.perched : styles.flying}`}>
        <Wing p={palette} side="l" />
        <Wing p={palette} side="r" />
        <svg className={styles.torso} viewBox="0 0 6 30" focusable="false">
          <path d="M3 6Q1.6 2.5 0.4 0.6M3 6Q4.4 2.5 5.6 0.6" fill="none" stroke="#4E121B" strokeWidth=".6" strokeLinecap="round" />
          <ellipse cx="3" cy="16" rx="1.5" ry="10" fill="#4E121B" />
        </svg>
      </span>
    </motion.div>
  );
}

/**
 * Butterfly — one or two butterflies that every ~8-12s fly to a random
 * visible [data-perch] element, land on its top edge for a few seconds,
 * then fly off. Fixed, pointer-events none. Off under reduced motion.
 */
export const Butterfly = memo(function Butterfly() {
  const reduced = useReducedMotionConfig();
  if (reduced) return null;
  return (
    <div className={styles.layer} aria-hidden="true">
      <Flyer palette={PALETTES[0]} startDelay={2500} />
      <Flyer palette={PALETTES[1]} startDelay={8500} />
    </div>
  );
});

export default Butterfly;

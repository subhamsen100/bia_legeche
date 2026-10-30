/* Reusable floral SVG primitives (marigold, shiuli, rajanigandha, lotus, leaves).
   Each SVG that uses them renders <FloraDefs id=... /> once and references the
   pieces with <use href="#id-xx" />, keeping the DOM small. */
import { useId } from 'react';
import {
  MARIGOLD,
  MARIGOLD_COLORS,
  SHIULI,
  RAJ,
  LOTUS_PETAL,
  LOTUS_VEIN,
  LEAF,
  LEAF_RIB,
  quadAt,
  quadSpread,
  rng,
} from './paths.js';

/** Stable, CSS-safe id prefix for <defs>. */
export function useSvgId(prefix = 'f') {
  return prefix + useId().replace(/[^a-zA-Z0-9]/g, '');
}

export const INK = '#7A1F2B';
export const OUTLINE = 'rgba(122,31,43,0.28)';

function MarigoldDef({ id, colors }) {
  return (
    <g id={id}>
      <path d={MARIGOLD.shadow} fill={colors[5]} transform="translate(.5 1)" opacity=".85" />
      {MARIGOLD.rings.map((d, i) => (
        <path
          key={i}
          d={d}
          fill={colors[i]}
          stroke={i < 4 ? colors[4] : 'none'}
          strokeWidth=".3"
          strokeOpacity=".5"
          transform={i ? `translate(${-0.15 * i} ${-0.25 * i})` : undefined}
        />
      ))}
      <path d={MARIGOLD.creases} fill="none" stroke={colors[4]} strokeWidth=".3" strokeLinecap="round" opacity=".4" />
    </g>
  );
}

function ShiuliPetals() {
  return SHIULI.angles.map((a) => (
    <g key={a} transform={`rotate(${a})`}>
      <path d={SHIULI.petal} fill="#fff" stroke="#E2CDB0" strokeWidth=".35" />
      <path d={SHIULI.vein} fill="none" stroke="#EADBC6" strokeWidth=".3" />
    </g>
  ));
}

/** Defs for every primitive. Cheap: defs are never painted until referenced. */
export function FloraDefs({ id }) {
  return (
    <defs>
      <linearGradient id={`${id}-lpb`} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#FBE3E2" />
        <stop offset=".55" stopColor="#EFAAB4" />
        <stop offset="1" stopColor="#C2546C" />
      </linearGradient>
      <linearGradient id={`${id}-lpf`} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#FFFBF5" />
        <stop offset=".6" stopColor="#F7CDD2" />
        <stop offset="1" stopColor="#DB7D91" />
      </linearGradient>
      <radialGradient id={`${id}-glow`}>
        <stop offset="0" stopColor="#FFE9A8" stopOpacity=".9" />
        <stop offset="1" stopColor="#FFE9A8" stopOpacity="0" />
      </radialGradient>

      <MarigoldDef id={`${id}-mo`} colors={MARIGOLD_COLORS.o} />
      <MarigoldDef id={`${id}-my`} colors={MARIGOLD_COLORS.y} />
      <MarigoldDef id={`${id}-mr`} colors={MARIGOLD_COLORS.r} />

      <g id={`${id}-sh`}>
        <ShiuliPetals />
        <circle r="1.5" fill="#F4A261" />
        <circle r=".6" fill="#D9682A" />
      </g>
      <g id={`${id}-shs`}>
        <path d="M0 0Q1.2 4.5 3.6 8.6" fill="none" stroke="#F4A261" strokeWidth="1.5" strokeLinecap="round" />
        <ShiuliPetals />
        <circle r="1.5" fill="#F4A261" />
      </g>

      <g id={`${id}-rf`}>
        <path d={RAJ.tube} fill="#FFFDF8" stroke="#E4D6BC" strokeWidth=".3" />
        <path d="M0-.3Q-.1-3 0-6" fill="none" stroke="#EBC3C3" strokeWidth=".6" strokeLinecap="round" />
        <g transform="translate(0 -11.8)">
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <path key={a} d={RAJ.petal} transform={`rotate(${a})`} fill="#fff" stroke="#E2D2B6" strokeWidth=".3" />
          ))}
          <circle r=".7" fill="#EFE2B8" />
        </g>
      </g>
      <g id={`${id}-rb`}>
        <path d={RAJ.bud} fill="#F7F4E6" stroke="#B9C9A8" strokeWidth=".35" />
        <path d="M0-.4C-.6-2-.7-4-.3-6" fill="none" stroke="#DDE6CC" strokeWidth=".4" />
      </g>

      <g id={`${id}-lf`}>
        <path d={LEAF} fill="#3E6B48" />
        <path d={LEAF_RIB} fill="none" stroke="#7FA487" strokeWidth=".45" />
      </g>
      <g id={`${id}-ll`}>
        <path d={LEAF} fill="#5E8A62" />
        <path d={LEAF_RIB} fill="none" stroke="#A9C6A6" strokeWidth=".45" />
      </g>
    </defs>
  );
}

/** <use> helper with transform shorthand. */
export function U({ id, k, x = 0, y = 0, r = 0, s = 1, ...rest }) {
  return <use href={`#${id}-${k}`} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} {...rest} />;
}

/** Side-view lotus, base at 0,0 pointing up (-y). Height ~34. */
export function Lotus({ id, x = 0, y = 0, r = 0, s = 1 }) {
  const back = `url(#${id}-lpb)`;
  const front = `url(#${id}-lpf)`;
  const petal = (a, sc, fill, key) => (
    <g key={key} transform={`rotate(${a}) scale(${sc})`}>
      <path d={LOTUS_PETAL} fill={fill} stroke="#B24A62" strokeWidth=".45" strokeOpacity=".55" />
      <path d={LOTUS_VEIN} fill="none" stroke="#fff" strokeWidth=".45" strokeOpacity=".45" />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <ellipse cx="0" cy="-12" rx="16" ry="14" fill={`url(#${id}-glow)`} />
      {petal(-62, 0.72, back, 'b1')}
      {petal(62, 0.72, back, 'b2')}
      {petal(-34, 0.88, back, 'm1')}
      {petal(34, 0.88, back, 'm2')}
      {petal(0, 1.02, back, 'c')}
      {petal(-15, 0.95, front, 'f1')}
      {petal(15, 0.95, front, 'f2')}
      <path d="M-7 1.5Q0-1.8 7 1.5Q0 4.2-7 1.5Z" fill="#3E6B48" />
      <path d="M-4 2.4Q-6.5 4.6-9.5 4.2M4 2.4Q6.5 4.6 9.5 4.2" fill="none" stroke="#3E6B48" strokeWidth="1" strokeLinecap="round" />
    </g>
  );
}

/** Rajanigandha stalk along a quadratic bezier: open flowers low, buds to the tip. */
export function RajStalk({ id, p0, c, p2, n = 7, seed = 5, w = 1.1, fs = 1 }) {
  const R = rng(seed);
  const items = [];
  for (let i = 0; i < n; i++) {
    const t = 0.22 + (0.78 * i) / (n - 1);
    const p = quadAt(p0, c, p2, Math.min(t, 0.98));
    const side = i % 2 === 0 ? 1 : -1;
    const isBud = i >= n - 3;
    const ang = p.a + 90 + side * (isBud ? 14 : 30 + R() * 14);
    items.push(
      <use
        key={i}
        href={`#${id}-${isBud ? 'rb' : 'rf'}`}
        transform={`translate(${p.x} ${p.y}) rotate(${ang.toFixed(1)}) scale(${(fs * (isBud ? 0.8 : 1) * (0.92 + R() * 0.16)).toFixed(2)})`}
      />,
    );
  }
  const tip = quadAt(p0, c, p2, 1);
  return (
    <g>
      <path
        d={`M${p0[0]} ${p0[1]}Q${c[0]} ${c[1]} ${p2[0]} ${p2[1]}`}
        fill="none"
        stroke="#5E8A62"
        strokeWidth={w}
        strokeLinecap="round"
      />
      {items}
      <use href={`#${id}-rb`} transform={`translate(${tip.x} ${tip.y}) rotate(${tip.a + 90}) scale(${(0.62 * fs).toFixed(2)})`} />
    </g>
  );
}

/** Marigold garland (mala) along a quadratic bezier. */
export function Garland({ id, p0, c, p2, n = 18, s = 0.8, seed = 9, pattern = ['mo', 'my', 'mo', 'mr', 'my'], leafEvery = 0 }) {
  const R = rng(seed);
  const pts = quadSpread(p0, c, p2, n);
  return (
    <g>
      <path
        d={`M${p0[0]} ${p0[1]}Q${c[0]} ${c[1]} ${p2[0]} ${p2[1]}`}
        fill="none"
        stroke="#A3812F"
        strokeWidth=".8"
      />
      {leafEvery > 0 &&
        pts.map((p, i) =>
          i % leafEvery === 1 ? (
            <U key={`l${i}`} id={id} k={i % 2 ? 'lf' : 'll'} x={p.x} y={p.y} r={p.a + (i % 4 < 2 ? 70 : -110)} s={s * 1.5} />
          ) : null,
        )}
      {pts.map((p, i) => {
        const edge = Math.min(i, n - 1 - i);
        const sc = s * (edge < 2 ? 0.78 + edge * 0.1 : 1) * (0.94 + R() * 0.12);
        return <U key={i} id={id} k={pattern[i % pattern.length]} x={p.x} y={p.y} r={Math.round(R() * 360)} s={sc.toFixed(2)} />;
      })}
    </g>
  );
}

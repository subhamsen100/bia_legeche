import { memo } from 'react';
import { FloraDefs, Garland, useSvgId } from '../assets/svg/flora.jsx';
import styles from './PortraitSilhouette.module.css';

const HALO_DOTS = Array.from({ length: 24 }, (_, i) => {
  const a = (i * 15 * Math.PI) / 180;
  return [Math.round((150 + Math.cos(a) * 96) * 10) / 10, Math.round((176 + Math.sin(a) * 96) * 10) / 10];
});

function Groom({ id }) {
  return (
    <g>
      {/* shoulders: panjabi */}
      <path d="M34 400C42 330 92 304 150 300C208 304 258 330 266 400Z" fill={`url(#${id}-fig)`} />
      <path d="M150 302V400M136 304Q150 322 164 304" fill="none" stroke="#E0C78A" strokeWidth="2" />
      <g fill="#E0C78A">
        <circle cx="150" cy="330" r="2.2" />
        <circle cx="150" cy="350" r="2.2" />
        <circle cx="150" cy="370" r="2.2" />
      </g>
      {/* chador (shawl) over one shoulder */}
      <path d="M210 312Q240 330 252 400L222 400Q214 350 192 318Z" fill="#F4E9CC" opacity=".85" />
      <path d="M222 400Q214 350 192 318" fill="none" stroke="#C9A24B" strokeWidth="2.4" />
      {/* neck + head */}
      <path d="M134 262H166L170 306Q150 314 130 306Z" fill={`url(#${id}-skin)`} />
      <ellipse cx="150" cy="232" rx="37" ry="45" fill={`url(#${id}-skin)`} />
      <path d="M113 222Q114 190 150 186Q186 190 187 222Q180 204 150 202Q120 204 113 222Z" fill="#4E121B" />
      {/* topor: conical shola crown */}
      <path d="M108 200L150 58L192 200Q150 212 108 200Z" fill="#FFFCF6" stroke="#C9A24B" strokeWidth="2" strokeLinejoin="round" />
      <path d="M116 176Q150 186 184 176M124 148Q150 156 176 148M132 122Q150 128 168 122M140 96Q150 100 160 96" fill="none" stroke="#C9A24B" strokeWidth="1.6" />
      <path d="M118 188Q150 198 182 188" fill="none" stroke="#7A1F2B" strokeWidth="2.4" />
      <g fill="#C2546C">
        <circle cx="150" cy="166" r="4.5" />
        <circle cx="136" cy="164" r="2.2" />
        <circle cx="164" cy="164" r="2.2" />
        <circle cx="150" cy="138" r="3" />
        <circle cx="150" cy="112" r="2.2" />
      </g>
      <path d="M150 58Q138 46 142 34Q150 44 150 58Q150 44 158 34Q162 46 150 58Z" fill="#FFFCF6" stroke="#C9A24B" strokeWidth="1.4" />
      <path d="M108 200Q96 196 92 206Q100 212 112 204M192 200Q204 196 208 206Q200 212 188 204" fill="#FFFCF6" stroke="#C9A24B" strokeWidth="1.2" />
    </g>
  );
}

function Bride({ id }) {
  return (
    <g>
      {/* benarasi saree drape with lal-paar gold border */}
      <path d="M30 400C38 320 84 292 150 290C216 292 262 320 270 400Z" fill={`url(#${id}-sari)`} />
      <path d="M150 140C102 140 88 190 92 246C96 296 70 330 60 400H84C96 340 120 300 150 296C180 300 204 340 216 400H240C230 330 204 296 208 246C212 190 198 140 150 140Z" fill="#9E2A35" />
      <path d="M60 400C70 330 96 296 92 246C88 190 102 140 150 140C198 140 212 190 208 246C204 296 230 330 240 400" fill="none" stroke="#E0C78A" strokeWidth="4" />
      <path d="M68 400C78 334 103 298 100 248C96 196 110 150 150 150C190 150 204 196 200 248C197 298 222 334 232 400" fill="none" stroke="#C9A24B" strokeWidth="1.2" strokeDasharray="2 4" />
      {/* neck + face */}
      <path d="M136 264H164L168 300Q150 308 132 300Z" fill={`url(#${id}-skin)`} />
      <ellipse cx="150" cy="232" rx="34" ry="42" fill={`url(#${id}-skin)`} />
      <path d="M116 226Q116 196 150 192Q184 196 184 226Q176 208 150 206Q124 208 116 226Z" fill="#4E121B" />
      {/* chandan dots + bindi */}
      <g fill="#FFFCF6">
        {[-22, -16, -10, -4, 4, 10, 16, 22].map((dx) => (
          <circle key={dx} cx={150 + dx} cy={216 - Math.cos(dx / 16) * 6} r="1.5" />
        ))}
      </g>
      <circle cx="150" cy="214" r="4" fill="#B8432A" />
      {/* mukut: shola crown */}
      <path
        d="M104 196Q100 170 114 158Q118 172 126 168Q124 146 140 136Q142 154 150 152Q158 154 160 136Q176 146 174 168Q182 172 186 158Q200 170 196 196Q150 182 104 196Z"
        fill="#FFFCF6"
        stroke="#C9A24B"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M110 190Q150 178 190 190" fill="none" stroke="#C9A24B" strokeWidth="1.4" />
      <g fill="#C2546C">
        <circle cx="150" cy="166" r="3.6" />
        <circle cx="128" cy="176" r="2" />
        <circle cx="172" cy="176" r="2" />
      </g>
      {/* nose ring hint */}
      <circle cx="160" cy="246" r="5" fill="none" stroke="#C9A24B" strokeWidth="1.2" />
    </g>
  );
}

/** PortraitSilhouette — illustrated groom (topor) / bride (mukut, chandan, lal-paar) placeholder. */
export const PortraitSilhouette = memo(function PortraitSilhouette({ kind = 'groom' }) {
  const id = useSvgId('ps');
  const bride = kind === 'bride';
  return (
    <svg
      className={styles.svg}
      viewBox="0 0 300 400"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      data-kind={bride ? 'bride' : 'groom'}
    >
      <FloraDefs id={id} />
      <defs>
        <radialGradient id={`${id}-bg`} cx=".5" cy=".42" r=".7">
          <stop offset="0" stopColor="#FDEFC4" />
          <stop offset=".6" stopColor="#FBEFD9" />
          <stop offset="1" stopColor="#F5E4C4" />
        </radialGradient>
        <linearGradient id={`${id}-fig`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F2E3C2" />
          <stop offset="1" stopColor="#E0C78A" />
        </linearGradient>
        <linearGradient id={`${id}-sari`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A8323F" />
          <stop offset="1" stopColor="#7A1F2B" />
        </linearGradient>
        <linearGradient id={`${id}-skin`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C98E6E" />
          <stop offset="1" stopColor="#B07558" />
        </linearGradient>
      </defs>
      <rect width="300" height="400" fill={`url(#${id}-bg)`} />
      <circle cx="150" cy="176" r="96" fill="#fff" opacity=".35" />
      <g fill="#C9A24B" opacity=".55">
        {HALO_DOTS.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 2 ? 1.4 : 2.4} />
        ))}
      </g>
      {bride ? <Bride id={id} /> : <Groom id={id} />}
      <Garland id={id} p0={[98, 300]} c={[150, 440]} p2={[202, 300]} n={13} s={0.95} seed={bride ? 5 : 9} />
    </svg>
  );
});

export default PortraitSilhouette;

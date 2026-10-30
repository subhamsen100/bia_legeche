/* Renders a { bn, en } pair according to the active language mode.
   bn -> Bengali only; en -> English only; both -> Bengali primary, English smaller below. */
import { useLanguage } from '../hooks/useLanguage.jsx';
import { formatTemplate } from '../hooks/useLanguage.jsx';
import { formatNumber } from '../utils/bengaliDigits.js';
import styles from './BilingualText.module.css';

const VARIANTS = ['display', 'body', 'caption', 'names'];

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

function isPair(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v) && ('bn' in v || 'en' in v);
}

/* Resolve vars for one language: pairs -> that side, numbers -> that language's digits. */
function resolveVars(vars, side) {
  if (!vars) return null;
  const out = {};
  for (const [k, v] of Object.entries(vars)) {
    if (isPair(v)) out[k] = v[side];
    else if (typeof v === 'number') out[k] = formatNumber(v, side);
    else out[k] = v;
  }
  return out;
}

function toLines(value) {
  if (Array.isArray(value)) return value;
  return String(value).split('\n');
}

export function BilingualText({
  text,
  as: Tag = 'p',
  className,
  bnClassName,
  enClassName,
  lineClassName,
  vars,
  lines = false,
  variant = 'body',
  renderLine,
  ...rest
}) {
  const { lang } = useLanguage();
  if (!text) return null;

  const sides = lang === 'both' ? ['bn', 'en'] : [lang];

  const renderSide = (side) => {
    const raw = text[side];
    if (raw === undefined || raw === null || raw === '') return null;
    const v = resolveVars(vars, side);
    const fill = (s) => (v ? formatTemplate(s, v) : s);
    const sideClass = cx(styles[side], side === 'bn' ? bnClassName : enClassName);

    if (lines) {
      const arr = toLines(raw).map(fill);
      return (
        <span key={side} lang={side} className={sideClass}>
          {arr.map((line, i) => (
            <span key={i} className={cx(styles.line, lineClassName)}>
              {renderLine ? renderLine(line, i, side) : line}
            </span>
          ))}
        </span>
      );
    }
    return (
      <span key={side} lang={side} className={sideClass}>
        {fill(Array.isArray(raw) ? raw.join(' ') : raw)}
      </span>
    );
  };

  return (
    <Tag
      className={cx(
        styles.root,
        styles[VARIANTS.includes(variant) ? variant : 'body'],
        lang === 'both' && styles.both,
        className,
      )}
      data-lang-mode={lang}
      {...rest}
    >
      {sides.map(renderSide)}
    </Tag>
  );
}

export default BilingualText;

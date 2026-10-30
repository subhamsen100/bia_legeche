/* /dev/i18n: every config string in the active mode, toggle, and digit samples. */
import { useEffect, useState } from 'react';
import config from '../config.js';
import { LanguageProvider, useLanguage } from '../hooks/useLanguage.jsx';
import { BilingualText } from '../components/BilingualText.jsx';
import { LanguageToggle } from '../components/LanguageToggle.jsx';
import { formatNumber, pad2, toBengaliDigits, toLatinDigits } from '../utils/bengaliDigits.js';

const isPair = (v) => v && typeof v === 'object' && !Array.isArray(v) && ('bn' in v || 'en' in v);

function collectPairs(node, path = 'config', out = []) {
  if (isPair(node)) {
    out.push([path, node]);
    return out;
  }
  if (node && typeof node === 'object' && !Array.isArray(node)) {
    for (const [k, v] of Object.entries(node)) collectPairs(v, `${path}.${k}`, out);
  }
  return out;
}

const s = {
  page: { maxWidth: '64rem', margin: '0 auto', padding: '1rem 16px 4rem' },
  bar: {
    position: 'sticky', top: 0, zIndex: 5, display: 'flex', flexWrap: 'wrap', gap: '0.75rem',
    alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0',
    background: 'var(--ivory)', borderBottom: 'var(--border-gold-soft)',
  },
  h2: { fontFamily: 'var(--font-en-display)', fontSize: 'var(--fs-lg)', margin: '2rem 0 0.75rem' },
  row: {
    display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '0.25rem', padding: '0.75rem 0',
    borderBottom: '1px solid rgba(201,162,75,0.35)',
  },
  path: { fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem', color: 'var(--maroon-300)', lineHeight: 1.4, overflowWrap: 'anywhere' },
  mono: { fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap', lineHeight: 1.75 },
  card: { background: 'var(--ivory-50)', border: 'var(--border-gold-hairline)', borderRadius: 'var(--radius-md)', padding: '1rem', boxShadow: 'var(--shadow-sm)' },
  digits: { display: 'flex', flexWrap: 'wrap', gap: '0.35rem' },
  chip: { minWidth: '2.6rem', textAlign: 'center', padding: '0.15rem 0.3rem', border: '1px solid rgba(201,162,75,0.6)', borderRadius: 6 },
};

const VARIANT_FOR = {
  'config.couple.names': 'names',
  'config.copy.signed': 'names',
  'config.couple.groom.firstName': 'names',
  'config.couple.bride.firstName': 'names',
};

function Inspector() {
  const { lang, pick, format, num } = useLanguage();
  const [htmlAttrs, setHtmlAttrs] = useState('');
  useEffect(() => {
    const h = document.documentElement;
    setHtmlAttrs(`<html lang="${h.lang}" data-lang="${h.getAttribute('data-lang')}">`);
  }, [lang]);

  const pairs = collectPairs(config);
  const { calendar, couple, venue, event } = config;
  const [y, m, d] = event.isoDate.split('-').map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const labelVars = (side) => ({
    day: formatNumber(d, side),
    month: calendar.monthNames[side][m - 1],
    year: formatNumber(y, side),
    weekday: calendar.weekdayLong[side][wd],
  });
  const shareVars = (side) => ({
    names: couple.names[side],
    date: format('{weekday}, {day} {month} {year}', labelVars(side)),
    time: event.timeLabel[side],
    venue: venue.name[side],
    address: venue.address[side],
    mapsUrl: venue.mapsUrl,
    url: window.location.origin + '/',
  });
  const shareText =
    format(config.share.whatsappText.bn, shareVars('bn')) + '\n\n' +
    format(config.share.whatsappText.en, shareVars('en'));

  return (
    <div style={s.page}>
      <div style={s.bar} data-testid="bar">
        <LanguageToggle />
        <code style={s.mono} data-testid="html-attrs">{htmlAttrs} · mode={lang}</code>
      </div>

      <h2 style={s.h2}>Digits</h2>
      <div style={s.card}>
        <div style={s.digits} data-testid="digits">
          {Array.from({ length: 31 }, (_, i) => (
            <span key={i} style={s.chip} data-n={i}>
              {num(i)}
            </span>
          ))}
        </div>
        <p style={{ ...s.mono, marginTop: '0.75rem' }} data-testid="digit-samples">
          {[
            `toBengaliDigits(2027) = ${toBengaliDigits(2027)}`,
            `toBengaliDigits('7:00') = ${toBengaliDigits('7:00')}`,
            `toLatinDigits('৭০০০২৯') = ${toLatinDigits('৭০০০২৯')}`,
            `pad2(7,'bn') = ${pad2(7, 'bn')}   pad2(7,'en') = ${pad2(7, 'en')}   pad2('৯','en') = ${pad2('৯', 'en')}`,
            `formatNumber(23,'both') = ${formatNumber(23, 'both')}   num(23) = ${num(23)}`,
          ].join('\n')}
        </p>
      </div>

      <h2 style={s.h2}>Derived / templated</h2>
      <div style={s.card}>
        <div style={s.row}>
          <span style={s.path}>calendar.markedLabel (formatted)</span>
          <BilingualText
            data-testid="marked-label"
            text={{ bn: format(calendar.markedLabel.bn, labelVars('bn')), en: format(calendar.markedLabel.en, labelVars('en')) }}
          />
        </div>
        {['groom', 'bride'].map((who) => (
          <div style={s.row} key={who}>
            <span style={s.path}>couple.familyLine ({who})</span>
            <BilingualText
              text={couple.familyLine}
              vars={{ relation: couple[who].relation, father: couple[who].father, mother: couple[who].mother }}
            />
          </div>
        ))}
        <div style={s.row}>
          <span style={s.path}>pick(copy.closing) — aria/title string</span>
          <span style={s.mono} data-testid="pick-closing">{pick(config.copy.closing)}</span>
        </div>
        <div style={s.row}>
          <span style={s.path}>copy.message (lines)</span>
          <BilingualText text={config.copy.message} lines variant="display" />
        </div>
        <div style={s.row}>
          <span style={s.path}>share.whatsappText (combined bn + \n\n + en)</span>
          <pre style={s.mono} data-testid="share">{shareText}</pre>
        </div>
      </div>

      <h2 style={s.h2}>Every config text pair ({pairs.length})</h2>
      <div style={s.card} data-testid="pairs">
        {pairs.map(([path, pair]) => {
          const hasArray = Array.isArray(pair.bn) || Array.isArray(pair.en);
          const isPlain = path === 'config.ui.languageModes';
          return (
            <div style={s.row} key={path}>
              <span style={s.path}>{path}</span>
              {isPlain ? (
                <span style={s.mono}>{JSON.stringify(pair)}</span>
              ) : (
                <BilingualText
                  text={pair}
                  lines={hasArray}
                  variant={VARIANT_FOR[path] || (path.startsWith('config.copy.sectionHeadings') ? 'display' : 'body')}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function I18nDev() {
  return (
    <LanguageProvider>
      <Inspector />
    </LanguageProvider>
  );
}

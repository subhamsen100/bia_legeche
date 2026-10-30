/* Bengali <-> Latin digit helpers. Pure (no React); digit map comes from config. */
import config from '../config.js';

const BN_DIGITS = config.digits.bn;
const BN_TO_LATIN = Object.fromEntries(BN_DIGITS.map((d, i) => [d, String(i)]));
const BN_DIGIT_RE = new RegExp(`[${BN_DIGITS.join('')}]`, 'g');

/** 23 -> '২৩', '7:00' -> '৭:০০'. Non-digit characters pass through unchanged. */
export function toBengaliDigits(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[0-9]/g, (d) => BN_DIGITS[d]);
}

/** '২৩' -> '23'. Non-digit characters pass through unchanged. */
export function toLatinDigits(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(BN_DIGIT_RE, (d) => BN_TO_LATIN[d]);
}

/** Bengali digits for lang 'bn' and 'both'; Latin digits for 'en'. */
export function formatNumber(n, lang) {
  return lang === 'en' ? toLatinDigits(n) : toBengaliDigits(n);
}

/** Zero-pads to two digits, then formats per language: pad2(7, 'bn') -> '০৭'. */
export function pad2(n, lang) {
  const latin = toLatinDigits(n);
  return formatNumber(latin.padStart(2, '0'), lang);
}

export default { toBengaliDigits, toLatinDigits, formatNumber, pad2 };

/* Language state for the whole invitation: 'bn' | 'en' | 'both' (default 'both'). */
import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react';
import { formatNumber } from '../utils/bengaliDigits.js';

export const LANGS = ['bn', 'en', 'both'];
export const STORAGE_KEY = 'invite.lang';
const DEFAULT_LANG = 'both';

function readStoredLang() {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return LANGS.includes(v) ? v : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

function isPair(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v) && ('bn' in v || 'en' in v);
}

/** Replace {token} in a template string. Unknown tokens are left untouched. */
export function formatTemplate(template, vars = {}) {
  if (typeof template !== 'string') return template;
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    vars[key] === undefined || vars[key] === null ? match : String(vars[key]),
  );
}

/** Build the helpers for a given mode (also usable outside React). */
export function makeHelpers(lang) {
  const single = lang === 'en' ? 'en' : 'bn'; // single-language side used for 'both' where one is needed

  const pick = (pair) => {
    if (!isPair(pair)) return pair;
    if (lang === 'bn') return pair.bn;
    if (lang === 'en') return pair.en;
    if (Array.isArray(pair.bn)) return pair.bn; // arrays: both -> bn array
    return `${pair.bn} / ${pair.en}`;
  };

  // vars may be { bn, en } pairs; resolved to the active single language (bn for 'both').
  const format = (template, vars = {}) => {
    const resolved = {};
    for (const [k, v] of Object.entries(vars)) resolved[k] = isPair(v) ? v[single] : v;
    return formatTemplate(isPair(template) ? template[single] : template, resolved);
  };

  const num = (n) => formatNumber(n, lang);

  return { pick, format, num };
}

const fallback = { lang: DEFAULT_LANG, setLang: () => {}, ...makeHelpers(DEFAULT_LANG) };
const LanguageContext = createContext(fallback);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readStoredLang);

  const setLang = useCallback((next) => {
    if (!LANGS.includes(next)) return;
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable: keep in-memory state only */
    }
  }, []);

  useLayoutEffect(() => {
    const html = document.documentElement;
    html.lang = lang === 'en' ? 'en' : 'bn';
    html.setAttribute('data-lang', lang);
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, ...makeHelpers(lang) }), [lang, setLang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/** { lang, setLang, pick, format, num }. Outside a provider it falls back to 'both' (read-only). */
export function useLanguage() {
  return useContext(LanguageContext);
}

export default useLanguage;

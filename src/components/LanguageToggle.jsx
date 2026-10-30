/* Segmented control "বাংলা | English | Both" (role=radiogroup, roving tabindex). */
import { useRef } from 'react';
import config from '../config.js';
import { LANGS, useLanguage } from '../hooks/useLanguage.jsx';
import styles from './LanguageToggle.module.css';

const OPTION_LANG = { bn: 'bn', en: 'en', both: 'en' };

export function LanguageToggle({ className }) {
  const { lang, setLang, pick } = useLanguage();
  const refs = useRef([]);
  const labels = config.ui.languageModes;

  const onKeyDown = (e) => {
    const i = LANGS.indexOf(lang);
    let next = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % LANGS.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + LANGS.length) % LANGS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = LANGS.length - 1;
    if (next === null) return;
    e.preventDefault();
    e.stopPropagation();
    setLang(LANGS[next]);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={pick(config.ui.languageToggle)}
      className={[styles.toggle, className].filter(Boolean).join(' ')}
      onKeyDown={onKeyDown}
      data-no-skip=""
    >
      {LANGS.map((code, i) => {
        const checked = code === lang;
        return (
          <button
            key={code}
            ref={(el) => (refs.current[i] = el)}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            lang={OPTION_LANG[code]}
            className={styles.option}
            onClick={(e) => {
              e.stopPropagation();
              setLang(code);
            }}
          >
            {labels[code]}
          </button>
        );
      })}
    </div>
  );
}

export default LanguageToggle;

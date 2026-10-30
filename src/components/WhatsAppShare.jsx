/* WhatsAppShare: https://wa.me/?text=<bilingual message> (bn + '\n\n' + en from
   config.share.whatsappText, tokens filled from config + derived date parts). */
import { memo, useMemo } from 'react';
import config from '../config.js';
import { formatTemplate } from '../hooks/useLanguage.jsx';
import { formatNumber } from '../utils/bengaliDigits.js';
import { buildMonthGrid } from './MonthCalendarGrid.js';
import { BilingualText } from './BilingualText.jsx';
import styles from './WhatsAppShare.module.css';

/** Public URL of the invitation (dev routes and query/hash stripped). */
export function invitationUrl() {
  if (typeof window === 'undefined') return '';
  const { origin, pathname } = window.location;
  const path = pathname.startsWith('/dev') ? '/' : pathname;
  return `${origin}${path}`;
}

/** The combined bilingual share text. */
export function buildShareText(url = invitationUrl()) {
  const cal = config.calendar;
  const g = buildMonthGrid(config.event.isoDate, cal.weekStartsOn, config.event.timeZone);
  const side = (s) =>
    formatTemplate(config.share.whatsappText[s], {
      names: config.couple.names[s],
      date: `${cal.weekdayLong[s][g.markedWeekday]}, ${formatNumber(g.markedDay, s)} ${cal.monthNames[s][g.monthIndex]} ${formatNumber(g.year, s)}`,
      time: config.event.timeLabel[s],
      venue: config.venue.name[s],
      address: config.venue.address[s],
      mapsUrl: config.venue.mapsUrl,
      url,
    });
  return `${side('bn')}\n\n${side('en')}`;
}

export function whatsappHref(text = buildShareText()) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function WhatsAppIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 2.2a9.7 9.7 0 0 0-8.3 14.7L2.3 21.8l5-1.3A9.7 9.7 0 1 0 12 2.2Zm0 17.7c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3 1 2.5c.1.2 1.6 2.5 4 3.5 1.5.6 2 .7 2.8.6.4-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.2-.3Z"
      />
    </svg>
  );
}

export const WhatsAppShare = memo(function WhatsAppShare({ className = '' }) {
  const href = useMemo(() => whatsappHref(), []);
  return (
    <a
      className={`${styles.button} ${className}`}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-no-skip=""
      data-whatsapp-share=""
    >
      <WhatsAppIcon />
      <BilingualText as="span" text={config.copy.shareWhatsApp} variant="body" className={styles.label} />
    </a>
  );
});

export default WhatsAppShare;

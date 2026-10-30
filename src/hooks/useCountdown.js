import { useEffect, useMemo, useState } from 'react';
import config from '../config.js';

/** Countdown target: `${isoDate}T${startTime}:00${utcOffset}` (e.g. 2027-11-23T19:00:00+05:30). */
export function getEventTarget(event = config.event) {
  return new Date(`${event.isoDate}T${event.startTime}:00${event.utcOffset}`);
}

/** Split a millisecond difference into whole days/hours/minutes/seconds (never negative). */
export function splitDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/**
 * useCountdown(target?, { tickMs }) -> { days, hours, minutes, seconds, done, target }
 * Ticks aligned to whole seconds; pauses its timer while the tab is hidden.
 */
export function useCountdown(target, { tickMs = 1000 } = {}) {
  const targetDate = useMemo(() => (target instanceof Date ? target : getEventTarget()), [target]);
  const targetMs = targetDate.getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!Number.isFinite(targetMs)) return undefined;
    let timer = null;
    const schedule = () => {
      const t = Date.now();
      setNow(t);
      if (t >= targetMs || document.hidden) return;
      timer = setTimeout(schedule, tickMs - (t % tickMs) + 15);
    };
    const onVisibility = () => {
      clearTimeout(timer);
      if (!document.hidden) schedule();
    };
    schedule();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [targetMs, tickMs]);

  const diff = targetMs - now;
  return { ...splitDuration(diff), done: !(diff > 0), target: targetDate };
}

export default useCountdown;

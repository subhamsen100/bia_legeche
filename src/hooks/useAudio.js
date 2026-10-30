import { useCallback, useEffect, useRef, useState } from 'react';
import config from '../config.js';

/*
 * useAudio — gate-triggered background music with code-driven fades.
 *
 * API (CONTRACTS.md section 7):
 *   const audio = useAudio(config.audio);
 *   audio.play()        call synchronously inside the gate tap handler
 *   audio.toggleMute()  persisted in localStorage `invite.muted`
 *   audio.fadeOut(ms)   fade to silence and pause (returns a Promise, resolves when done)
 *   audio.muted / audio.ready / audio.failed
 *
 * Behaviour notes
 * - The <audio> element is created lazily inside play(); nothing is fetched before the gate.
 * - Fades are rAF-driven writes to `audio.volume`. iOS Safari ignores `volume` (always 1), so there
 *   the fades are silent no-ops and muting is done through the `muted` property + pause(), which
 *   iOS does honour. Mute/unmute therefore works everywhere; only the smooth ramp is lost on iOS.
 * - Every failure (missing file, unsupported/decode error, NotAllowedError) sets `failed` and is
 *   reported with console.debug only. No promise rejection ever escapes.
 * - Hidden tab -> pause immediately (rAF does not run in background tabs). Visible again -> resume
 *   with a fade if playback was wanted and the user has not muted.
 */

const STORAGE_KEY = 'invite.muted';
const MUTE_FADE_MS = 350; // "mute fades out quickly"
const UNMUTE_FADE_MS = 1000; // unmute fades back in (capped by fadeInMs)

function readMuted() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeMuted(value) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
  } catch {
    /* storage unavailable (private mode etc.) — state still works for this session */
  }
}

function clampVolume(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function debug(...args) {
  if (typeof console !== 'undefined' && console.debug) console.debug('[audio]', ...args);
}

export function useAudio(audioConfig = config.audio) {
  const cfgRef = useRef(audioConfig);
  cfgRef.current = audioConfig || config.audio;

  const audioRef = useRef(null); // HTMLAudioElement, created lazily in play()
  const rafRef = useRef(0);
  const fadeResolveRef = useRef(null);
  const wantPlayingRef = useRef(false); // user intent: gate opened and not faded out
  const failedRef = useRef(false);
  const mutedRef = useRef(null);
  if (mutedRef.current === null) mutedRef.current = readMuted();

  const [muted, setMuted] = useState(mutedRef.current);
  const [ready, setReady] = useState(false);
  const [failed, setFailedState] = useState(false);

  const setFailed = useCallback((value, reason) => {
    if (value && reason) debug('playback unavailable:', reason);
    failedRef.current = value;
    setFailedState(value);
  }, []);

  /* ---------- fades ---------- */

  const cancelFade = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    // Settle any pending fadeOut() promise so callers never hang.
    const resolve = fadeResolveRef.current;
    fadeResolveRef.current = null;
    if (resolve) resolve(false);
  }, []);

  // Ramp audio.volume from its current value to `target` over `ms`, then call onDone.
  const fadeTo = useCallback(
    (target, ms, onDone) => {
      cancelFade();
      const el = audioRef.current;
      if (!el) {
        if (onDone) onDone();
        return;
      }
      const to = clampVolume(target);
      const from = clampVolume(el.volume);
      const duration = Math.max(0, Number(ms) || 0);
      if (duration === 0 || from === to) {
        el.volume = to;
        if (onDone) onDone();
        return;
      }
      const start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / duration);
        el.volume = clampVolume(from + (to - from) * t);
        if (t < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          rafRef.current = 0;
          if (onDone) onDone();
        }
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [cancelFade],
  );

  /* ---------- low-level start ---------- */

  // Calls el.play() from volume 0 and fades in. Never throws, never leaks a rejection.
  const startPlayback = useCallback(
    (fadeMs) => {
      const el = audioRef.current;
      if (!el) return;
      cancelFade();
      el.muted = false;
      el.volume = 0;
      let p;
      try {
        p = el.play();
      } catch (err) {
        setFailed(true, err && err.name ? err.name : err);
        return;
      }
      if (p && typeof p.catch === 'function') {
        p.catch((err) => {
          // AbortError = play() interrupted by our own pause() (tab hidden, mute) — not a failure.
          if (err && err.name === 'AbortError') return;
          setFailed(true, err && err.name ? err.name : err);
        });
      }
      fadeTo(cfgRef.current.volume ?? 0.5, fadeMs);
    },
    [cancelFade, fadeTo, setFailed],
  );

  const ensureElement = useCallback(() => {
    if (audioRef.current) return audioRef.current;
    if (typeof Audio === 'undefined') return null;
    const cfg = cfgRef.current;
    const el = new Audio();
    el.preload = 'none'; // set before src: nothing is fetched until play()
    el.loop = cfg.loop !== false;
    el.volume = 0;
    el.addEventListener('canplay', () => setReady(true));
    el.addEventListener('playing', () => {
      setReady(true);
      if (failedRef.current) setFailed(false);
    });
    el.addEventListener('error', () => {
      const code = el.error ? el.error.code : 'unknown';
      setReady(false);
      setFailed(true, `media error code ${code} for ${cfg.src}`);
    });
    if (cfg.src) {
      el.src = cfg.src;
    }
    audioRef.current = el;
    return el;
  }, [setFailed]);

  /* ---------- public API ---------- */

  // MUST be called synchronously inside the gate's tap/click handler (user activation).
  const play = useCallback(() => {
    wantPlayingRef.current = true;
    const cfg = cfgRef.current;
    if (!cfg || !cfg.src) {
      setFailed(true, 'no audio src configured');
      return;
    }
    const el = ensureElement();
    if (!el) {
      setFailed(true, 'HTMLAudioElement unsupported');
      return;
    }
    if (mutedRef.current) {
      // Respect persisted mute: don't fetch/play yet. Unmuting (itself a user gesture) starts it.
      el.muted = true;
      return;
    }
    el.preload = 'auto';
    if (!el.paused) {
      // Already playing (e.g. replay): just make sure we ramp to the target volume.
      fadeTo(cfg.volume ?? 0.5, cfg.fadeInMs ?? 3000);
      return;
    }
    startPlayback(cfg.fadeInMs ?? 3000);
  }, [ensureElement, fadeTo, setFailed, startPlayback]);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    writeMuted(next);

    const el = audioRef.current;
    if (!el) return; // gate not opened yet: only the preference changes
    const cfg = cfgRef.current;
    if (next) {
      fadeTo(0, Math.min(MUTE_FADE_MS, cfg.fadeOutMs ?? MUTE_FADE_MS), () => {
        el.muted = true; // the only thing iOS honours
        el.pause();
      });
    } else if (wantPlayingRef.current && !document.hidden) {
      el.preload = 'auto';
      startPlayback(Math.min(UNMUTE_FADE_MS, cfg.fadeInMs ?? UNMUTE_FADE_MS));
    }
  }, [fadeTo, startPlayback]);

  const fadeOut = useCallback(
    (ms) => {
      wantPlayingRef.current = false;
      const el = audioRef.current;
      if (!el || el.paused) {
        if (el) el.pause();
        return Promise.resolve(true);
      }
      const duration = ms ?? cfgRef.current.fadeOutMs ?? 1200;
      return new Promise((resolve) => {
        fadeTo(0, duration, () => {
          fadeResolveRef.current = null;
          el.pause();
          resolve(true);
        });
        // fadeTo cancelled any earlier fade (resolving its promise); register ours afterwards.
        if (rafRef.current) fadeResolveRef.current = resolve;
      });
    },
    [fadeTo],
  );

  /* ---------- visibility pause / resume ---------- */

  useEffect(() => {
    const onVisibility = () => {
      const el = audioRef.current;
      if (!el) return;
      if (document.hidden) {
        cancelFade();
        if (!el.paused) el.pause();
      } else if (wantPlayingRef.current && !mutedRef.current && el.paused && !failedRef.current) {
        startPlayback(cfgRef.current.fadeInMs ?? 3000);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [cancelFade, startPlayback]);

  /* ---------- teardown on unmount (StrictMode-safe: nothing exists before play()) ---------- */

  useEffect(
    () => () => {
      cancelFade();
      const el = audioRef.current;
      audioRef.current = null;
      if (el) {
        try {
          el.pause();
          el.removeAttribute('src');
          el.load();
        } catch {
          /* ignore */
        }
      }
    },
    [cancelFade],
  );

  return { play, toggleMute, muted, ready, failed, fadeOut };
}

export default useAudio;

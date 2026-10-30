// Config sanity: timeline length, ISO date, maps URL, placeholders, copy from SPEC verbatim.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import config from '../src/config.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MAPS_URL = 'https://maps.app.goo.gl/DAW7kmpgxBA3xEicA';

test('guided timeline: expected scene order, total >= 60s (target ~76s)', () => {
  const scenes = config.timeline.scenes;
  assert.deepEqual(
    scenes.map((s) => s.id),
    ['opening', 'names', 'family', 'message', 'date', 'venue', 'closing'],
  );
  for (const s of scenes) assert.ok(Number.isFinite(s.durationMs) && s.durationMs > 0, s.id);
  const total = scenes.reduce((a, s) => a + s.durationMs, 0);
  assert.ok(total >= 60000, `timeline total ${total}ms < 60000ms`);
  assert.ok(total >= 70000 && total <= 85000, `timeline total ${total}ms is far from the ~76s target`);
  assert.ok(config.timeline.crossfadeMs > 0 && config.timeline.crossfadeMs <= 1500);
});

test('scene registry covers every timed scene id', () => {
  const src = readFileSync(`${ROOT}src/components/SceneRegistry.js`, 'utf8');
  for (const { id } of config.timeline.scenes) {
    assert.match(src, new RegExp(`\\b${id}\\s*:`), `SceneRegistry has no "${id}" entry`);
  }
});

test('event date/time: valid ISO date, countdown target 2027-11-23 19:00 IST', () => {
  const { isoDate, startTime, utcOffset, timeZone } = config.event;
  assert.match(isoDate, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(isoDate, '2027-11-23');
  assert.equal(timeZone, 'Asia/Kolkata');
  const target = new Date(`${isoDate}T${startTime}:00${utcOffset}`);
  assert.ok(!Number.isNaN(target.getTime()));
  assert.equal(target.toISOString(), '2027-11-23T13:30:00.000Z');
  assert.equal(config.event.timeLabel.en, '7:00 PM onwards');
  assert.equal(config.event.name.en, 'Wedding Reception');
});

test('maps URL (also the QR payload)', () => {
  assert.equal(config.venue.mapsUrl, MAPS_URL);
  assert.doesNotThrow(() => new URL(config.venue.mapsUrl));
});

test('venue and address strings', () => {
  assert.equal(config.venue.name.en, 'Ghoshbari');
  assert.equal(config.venue.name.bn, 'ঘোষবাড়ি');
  assert.equal(
    config.venue.address.en,
    '11, Keyatala Ln, Golpark, Hindustan Park, Keyatala, Kolkata, West Bengal 700029',
  );
  assert.equal(
    config.venue.address.bn,
    '১১, কেয়াতলা লেন, গোলপার্ক, হিন্দুস্তান পার্ক, কেয়াতলা, কলকাতা, পশ্চিমবঙ্গ ৭০০০২৯',
  );
});

test('placeholders are visibly bracketed in both languages', () => {
  for (const who of ['groom', 'bride']) {
    const p = config.couple[who];
    for (const key of ['fullName', 'father', 'mother', 'photoAlt']) {
      for (const lang of ['bn', 'en']) {
        assert.match(p[key][lang], /\[[^\]]+\]/, `couple.${who}.${key}.${lang} = ${p[key][lang]}`);
      }
    }
    assert.match(p.photo, /^\/images\/.+\.(jpe?g|webp|png|avif)$/i);
  }
  assert.equal(config.couple.groom.father.en, "[Groom's Father]");
  assert.equal(config.couple.groom.father.bn, '[বরের বাবা]');
});

test('every text pair is filled in both languages (no empty strings)', () => {
  const empties = [];
  const walk = (v, path) => {
    if (typeof v === 'string') {
      if (!v.trim()) empties.push(path);
    } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
    else if (v && typeof v === 'object') for (const k of Object.keys(v)) walk(v[k], `${path}.${k}`);
  };
  walk(config, 'config');
  assert.deepEqual(empties, []);
});

test('copy matches SPEC.md verbatim', () => {
  const spec = readFileSync(`${ROOT}.claude/SPEC.md`, 'utf8');
  const c = config.copy;
  const strings = [
    ...c.message.bn,
    ...c.message.en,
    c.dateTagline.bn,
    c.dateTagline.en,
    c.venueTagline.bn,
    c.venueTagline.en,
    c.closing.bn,
    c.closing.en,
    c.signed.bn,
    c.signed.en,
    c.gatePrompt.bn,
    c.gatePrompt.en,
    c.scanCaption.bn,
    c.scanCaption.en,
  ];
  assert.equal(c.message.bn.length, 3);
  assert.equal(c.message.en.length, 3);
  for (const s of strings) assert.ok(spec.includes(s), `not found verbatim in SPEC.md: ${JSON.stringify(s)}`);
});

test('audio config', () => {
  assert.equal(config.audio.src, '/audio/bg.mp3');
  assert.equal(config.audio.volume, 0.5);
  assert.equal(config.audio.fadeInMs, 3000);
  assert.equal(config.audio.loop, true);
});

test('Bengali digits map', () => {
  assert.deepEqual(config.digits.bn, ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']);
});

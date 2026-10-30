/* ==========================================================================
   Site configuration: the ONLY place event data and user-visible copy live.
   Plain ESM with no imports, so Node scripts (QR verify, tests) can import it.

   Text values are bilingual pairs { bn, en } unless noted.
   Placeholders that must be replaced before sharing are marked with [brackets].
   Derived values (weekday, month name, countdown target) are COMPUTED from
   event.isoDate / startTime; never store them here as text.
   ========================================================================== */

const config = {
  /* ---------- Page meta (index.html mirrors these for OG tags) ---------- */
  meta: {
    title: 'Sreerupa & Subham   | Reception, 23 Nov 2027',
    description: {
      bn: 'শ্রীরূপার বধূবরণে আপনাকে সাদর আমন্ত্রণ, মঙ্গলবার ২৩ নভেম্বর ২০২৭, ঘোষবাড়ি, কেয়াতলা।',
      en: 'You are invited to the wedding reception of Subham & Sreerupa, Tuesday 23 November 2027, Ghoshbari, Keyatala, Kolkata.',
    },
  },

  /* ---------- Event: date/time are the single source of truth ---------- */
  event: {
    isoDate: '2027-11-23', // YYYY-MM-DD; calendar, weekday and countdown derive from this
    startTime: '19:00', // 24h, in event.timeZone
    timeZone: 'Asia/Kolkata',
    utcOffset: '+05:30',
    name: { bn: 'বধূবরণ', en: 'Wedding Reception' },
    timeLabel: { bn: 'সন্ধ্যা ৭টা থেকে', en: '7:00 PM onwards' }, // placeholder, editable
  },

  /* ---------- Couple & families (replace [bracketed] placeholders) ---------- */
  couple: {
    names: { bn: 'শুভম ও শ্রীরূপা', en: 'Subham & Sreerupa' },
    bride: {
      firstName: { bn: 'শ্রীরূপা', en: 'Sreerupa' },
      fullName: { bn: 'শ্রীরূপা সরকার', en: 'Sreerupa Sarkar' },
      photo: '/images/bride.jpg', // optional; a missing file shows a silhouette
      photoAlt: { bn: '[কনে শ্রীরূপার ছবি]', en: '[Photo of Sreerupa, the bride]' },
      relation: { bn: 'কন্যা', en: 'Daughter' },
      father: { bn: 'শুভ্রেন্দু সরকার', en: "Subhrendu Sarkar" },
      mother: { bn: 'মালা সরকার', en: "Mala Sarkar" },
    },
    groom: {
      firstName: { bn: 'শুভম', en: 'Subham' },
      fullName: { bn: 'শুভম সেন', en: 'Subham Sen' },
      photo: '/images/groom.jpg', // optional; a missing file shows a silhouette
      photoAlt: { bn: '[বর শুভমের ছবি]', en: '[Photo of Subham, the groom]' },
      relation: { bn: 'পুত্র', en: 'Son' },
      father: { bn: 'স্বরণ সেন', en: "Swaran Sen" },
      mother: { bn: 'কৃষ্ণা সেন', en: "Krishna Sen" },
    },
    // template tokens: {relation} {father} {mother}
    familyLine: {
      bn: '{father} ও {mother}-এর {relation}',
      en: '{relation} of {father} & {mother}',
    },
  },

  /* ---------- Venue (mapsUrl also feeds the QR code) ---------- */
  venue: {
    name: { bn: 'ঘোষবাড়ি', en: 'Ghoshbari' },
    locality: { bn: 'কেয়াতলার কাছে', en: 'near Keyatala' },
    address: {
      bn: '১১, কেয়াতলা লেন, গোলপার্ক, হিন্দুস্তান পার্ক, কেয়াতলা, কলকাতা, পশ্চিমবঙ্গ ৭০০০২৯',
      en: '11, Keyatala Ln, Golpark, Hindustan Park, Keyatala, Kolkata, West Bengal 700029',
    },
    mapsUrl: 'https://maps.app.goo.gl/DAW7kmpgxBA3xEicA',
  },

  /* ---------- Copy shown in the scenes and the final page ---------- */
  copy: {
    gatePrompt: { bn: 'খুলুন', en: 'Tap to open' },
    message: {
      bn: [
        'দুটো মন, দুটো পরিবার, আর একটা নতুন গল্পের শুরু।',
        'আপনাদের আশীর্বাদ আর ভালোবাসাতেই আমাদের এই পথচলা পূর্ণ হবে।',
        'তাই আমাদের আনন্দের সন্ধ্যায় আপনি আসুন, আমাদের পাশে থাকুন।',
      ],
      en: [
        'Two hearts, two families, one beginning.',
        'Our story feels most complete when the people we love are around us.',
        'Come celebrate an evening of good food, old stories, and new memories.',
      ],
    }, // arrays of lines, shown in sequence
    dateTagline: { bn: 'এই সন্ধ্যাটা আমাদের জন্য তুলে রাখুন', en: 'Save this evening for us' },
    venueTagline: {
      bn: 'ঘোষবাড়ির আঙিনায়, আপনার অপেক্ষায়',
      en: "At Ghoshbari, where we'll be waiting for you",
    },
    closing: {
      bn: 'আপনার উপস্থিতিই আমাদের সবচেয়ে বড় উপহার।',
      en: "Your presence is the only gift we'll ask for.",
    },
    signed: { bn: '—  শ্রীরূপা ও শুভম ', en: 'Sreerupa & Subham' },
    scanCaption: { bn: 'স্ক্যান করুন', en: 'Scan for directions' },
    openInMaps: { bn: 'ম্যাপে দেখুন', en: 'Open in Maps' },
    replay: { bn: 'আবার দেখুন', en: 'Replay' },
    shareWhatsApp: { bn: 'হোয়াটসঅ্যাপে পাঠান', en: 'Share on WhatsApp' },
    skipHint: { bn: 'এগিয়ে যেতে যেকোনো জায়গায় ছুঁয়ে দিন', en: 'Tap anywhere to skip ahead' },
    countdown: {
      days: { bn: 'দিন', en: 'Days' },
      hours: { bn: 'ঘণ্টা', en: 'Hours' },
      minutes: { bn: 'মিনিট', en: 'Minutes' },
      seconds: { bn: 'সেকেন্ড', en: 'Seconds' },
      done: { bn: 'আজই সেই আনন্দের সন্ধ্যা!', en: 'The evening is finally here!' },
    },
    sectionHeadings: {
      couple: { bn: 'বর ও কনে', en: 'The Couple' },
      date: { bn: 'দিনক্ষণ', en: 'Date & Time' },
      venue: { bn: 'অনুষ্ঠানস্থল', en: 'The Venue' },
    },
  },

  /* ---------- UI control labels & aria-labels ---------- */
  ui: {
    mute: { bn: 'গান বন্ধ করুন', en: 'Mute music' },
    unmute: { bn: 'গান চালু করুন', en: 'Unmute music' },
    languageToggle: { bn: 'ভাষা বেছে নিন', en: 'Choose language' },
    languageModes: { bn: 'বাংলা', en: 'English', both: 'Both' }, // plain strings
    progress: { bn: 'আমন্ত্রণপত্র কতটা এগোল', en: 'Invitation progress' }, // aria-label for the progress vine
  },

  /* ---------- Calendar strings (month/weekday names, marked-date label) ---------- */
  calendar: {
    weekStartsOn: 0, // 0 = Sunday
    monthNames: {
      bn: [
        'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
        'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
      ],
      en: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ],
    },
    weekdayShort: {
      bn: ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'],
      en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    },
    weekdayInitial: { en: ['S', 'M', 'T', 'W', 'T', 'F', 'S'] },
    weekdayLong: {
      bn: ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'],
      en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    },
    // tokens: {day} {month} {year} {weekday}
    markedLabel: {
      bn: '{day} {month} {year}, {weekday}, বিবাহ-সংবর্ধনা',
      en: '{day} {month} {year}, {weekday}, reception',
    },
  },

  /* ---------- Bengali digit map (index = Latin digit) ---------- */
  digits: { bn: ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'] },

  /* ---------- Guided sequence timing (sum must stay >= 60000ms) ---------- */
  timeline: {
    // Gate precedes these (untimed); the free-scroll final page follows.
    scenes: [
      { id: 'opening', durationMs: 10000 },
      { id: 'names', durationMs: 10000 },
      { id: 'family', durationMs: 12000 },
      { id: 'message', durationMs: 12000 },
      { id: 'date', durationMs: 14000 },
      { id: 'venue', durationMs: 12000 },
      { id: 'closing', durationMs: 6000 },
    ], // sum = 76000ms
    crossfadeMs: 900,
  },

  /* ---------- Background music (place your licensed file at public/audio/bg.mp3) ---------- */
  audio: {
    src: '/audio/bg.mp3',
    volume: 0.5,
    fadeInMs: 3000,
    fadeOutMs: 1200,
    loop: true,
  },

  /* ---------- WhatsApp share text ---------- */
  share: {
    // tokens: {names} {date} {time} {venue} {address} {mapsUrl} {url}
    // combined message = bn + '\n\n' + en
    whatsappText: {
      bn:
        'আমাদের বিবাহ-সংবর্ধনায় আপনাকে সাদর আমন্ত্রণ জানাই।\n' +
        'দিন: {date}, {time}\n' +
        'স্থান: {venue}, {address}\n' +
        'পথ দেখুন: {mapsUrl}\n' +
        'আমন্ত্রণপত্র: {url}\n' +
        'আপনার অপেক্ষায় রইলাম। — {names}',
      en:
        "You're warmly invited to our wedding reception.\n" +
        'When: {date}, {time}\n' +
        'Where: {venue}, {address}\n' +
        'Directions: {mapsUrl}\n' +
        'Invitation: {url}\n' +
        "We can't wait to celebrate with you! — {names}",
    },
  },
};

export { config };
export default config;

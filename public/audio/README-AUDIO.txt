BACKGROUND MUSIC — where to put the file
========================================

Place the track at:

    public/audio/bg.mp3

It is served as /audio/bg.mp3 (see config.audio.src in src/config.js). To use another file name
or format, change config.audio.src.

The bg.mp3 shipped in this repository is a SILENT PLACEHOLDER (about 10 s of silence, mono,
32 kbps, ~40 KB, generated with ffmpeg). It only exists so the deployed site doesn't 404.
REPLACE IT with your licensed track using the same file name. No music is committed to this
repository.

If the file is deleted or cannot be decoded, the invitation works exactly the same, silently:
useAudio() sets `failed`, the mute button stays usable (slightly dimmed), and nothing is logged
beyond console.debug.

Licensing
---------
Use ONLY music you have the right to publish on a public website:
  - royalty-free / Creative Commons (check the licence allows this use; credit if required), or
  - a track you have properly licensed, or recorded yourself.
Intended mood: soft shehnai or sitar instrumental with light tabla, or a Rabindrasangeet
INSTRUMENTAL. Do not use commercial film/album recordings or vocals you do not hold rights to.

Recommended encoding
--------------------
  - MP3, 96-128 kbps, 44.1 kHz, stereo (or mono 64-96 kbps); aim for under ~2 MB.
  - Length 90 s to 3 min; it loops (config.audio.loop), so trim to a seamless loop point and
    avoid a long silent tail. The guided sequence is about 76 s.
  - Normalise to around -16 LUFS; playback volume is config.audio.volume (0.5).

Behaviour (src/hooks/useAudio.js)
---------------------------------
  - Nothing is downloaded until the guest taps the gate ("খুলুন / Tap to open").
  - Fade in over config.audio.fadeInMs (3 s); fadeOut(ms) defaults to config.audio.fadeOutMs.
  - Mute state is remembered in localStorage key `invite.muted`.
  - Pauses when the tab is hidden, resumes with a fade when visible again.
  - iOS Safari ignores programmatic volume, so on iPhone/iPad the music starts at full device
    volume without a fade; mute/unmute still works (via the `muted` property).

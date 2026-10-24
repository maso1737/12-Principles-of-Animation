/* ============================================================
   FOLEY CORE — shared procedural SFX runtime for Gen-EX tools
   ------------------------------------------------------------
   Drop-in, zero assets, works over file://.

     <script src="path/to/foley-core.js"></script>
     Foley.play('confirm');

   Engine: ZzFX (Frank Force / KilledByAPixel, MIT) — de-minified core.
   A sound is a 20-number ZzFX parameter array. Palette below is the
   canonical vocabulary, kept in sync with foley-stage.html (SFX FORGE).

   Design goals
   ------------
   - One <script> tag, no build, no dependency.
   - Autoplay-safe: the AudioContext is created lazily and unlocked on
     the first user gesture automatically. Callers never worry about it.
   - Never throws. If audio is blocked or muted, play() is a silent no-op.
   - Small, stable API surface so every existing app can adopt it with
     one line and never need to touch it again.
   ============================================================ */
(function (global) {
  'use strict';

  var SR = 44100;
  var ZZFX_TRIM = 0.3; // internal volume trim — matches SFX FORGE exactly

  /* ── ZzFX generator (faithful) → Float array ─────────────── */
  function zzfxG(
    volume, randomness, frequency, attack, sustain,
    release, shape, shapeCurve, slide, deltaSlide,
    pitchJump, pitchJumpTime, repeatTime, noise, modulation,
    bitCrush, delay, sustainVolume, decay, tremolo
  ) {
    volume = volume == null ? 1 : volume;
    randomness = randomness || 0.05;
    frequency = frequency || 220;
    attack = attack || 0; sustain = sustain || 0;
    release = release == null ? 0.1 : release;
    shape = shape || 0; shapeCurve = shapeCurve == null ? 1 : shapeCurve;
    slide = slide || 0; deltaSlide = deltaSlide || 0;
    pitchJump = pitchJump || 0; pitchJumpTime = pitchJumpTime || 0;
    repeatTime = repeatTime || 0; noise = noise || 0; modulation = modulation || 0;
    bitCrush = bitCrush || 0; delay = delay || 0;
    sustainVolume = sustainVolume == null ? 1 : sustainVolume;
    decay = decay || 0; tremolo = tremolo || 0;

    var PI2 = Math.PI * 2, sign = function (v) { return v > 0 ? 1 : -1; },
      startSlide = slide *= 500 * PI2 / SR / SR,
      startFrequency = frequency *= (1 + randomness * 2 * Math.random() - randomness) * PI2 / SR,
      b = [], t = 0, tm = 0, i = 0, j = 1, r = 0, c = 0, s = 0, f, length;
    attack = attack * SR + 9; decay *= SR; sustain *= SR; release *= SR; delay *= SR;
    deltaSlide *= 500 * PI2 / (SR * SR * SR); modulation *= PI2 / SR; pitchJump *= PI2 / SR;
    pitchJumpTime *= SR; repeatTime = repeatTime * SR | 0;

    for (length = attack + decay + sustain + release + delay | 0; i < length; b[i++] = s) {
      if (!(++c % (bitCrush * 100 | 0))) {
        s = shape ? shape > 1 ? shape > 2 ? shape > 3 ?
          Math.sin((t % PI2) * (t % PI2) * (t % PI2)) :
          Math.max(Math.min(Math.tan(t), 1), -1) :
          1 - (2 * t / PI2 % 2 + 2) % 2 :
          1 - 4 * Math.abs(Math.round(t / PI2) - t / PI2) :
          Math.sin(t);
        s = (repeatTime ? 1 - tremolo + tremolo * Math.sin(PI2 * i / repeatTime) : 1) *
          sign(s) * (Math.pow(Math.abs(s), shapeCurve)) *
          volume * ZZFX_TRIM * (
            i < attack ? i / attack :
              i < attack + decay ? 1 - ((i - attack) / decay) * (1 - sustainVolume) :
                i < attack + decay + sustain ? sustainVolume :
                  i < length - delay ? (length - i - delay) / release * sustainVolume :
                    0);
        s = delay ? s / 2 + (delay > i ? 0 : (i < length - delay ? 1 : (length - i) / delay) * b[i - delay | 0] / 2) : s;
      }
      f = (frequency += slide += deltaSlide) * Math.cos(modulation * tm++);
      t += f - f * noise * (1 - (Math.sin(i) + 1) * 1e9 % 2);
      if (j && ++j > pitchJumpTime) { frequency += pitchJump; startFrequency += pitchJump; j = 0; }
      if (repeatTime && !(++r % repeatTime)) { frequency = startFrequency; slide = startSlide; j = j || 1; }
    }
    return b;
  }

  /* ── SOUND PALETTE — canonical vocabulary ─────────────────
     Names are stable public identifiers. Keep in sync with the
     TOKENS/PRESETS in foley-stage.html. Add via Foley.define().
     [vol,rand,freq,atk,sus,rel,shape,curve,slide,dslide,pjump,ptime,rep,noise,mod,crush,delay,svol,decay,trem]
  */
  var PALETTE = {
    // — UI / semantic tokens —
    'tick':    [0.34, 0, 1300, 0, 0, 0.035, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    'toggle-on':  [0.42, 0, 520, 0, 0, 0.06, 0, 1, 0, 0, 260, 0.015, 0, 0, 0, 0, 0, 1, 0, 0],
    'toggle-off': [0.42, 0, 520, 0, 0, 0.06, 0, 1, 0, 0, -200, 0.015, 0, 0, 0, 0, 0, 1, 0, 0],
    'confirm': [0.42, 0, 440, 0, 0.02, 0.13, 0, 1, 9, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0.04, 0],
    'select':  [0.32, 0, 900, 0, 0, 0.05, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    'error':   [0.42, 0.02, 210, 0, 0.05, 0.18, 2, 1, -6, 0, 0, 0, 0, 0.05, 0, 0.06, 0, 1, 0.05, 0],
    'enter':   [0.32, 0, 300, 0.02, 0, 0.22, 1, 1, 11, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0.1, 0],

    // — arcade / reward —
    'coin':    [0.45, 0, 1046, 0, 0.1, 0.22, 0, 0, 0, 0, 500, 0.05, 0, 0, 0, 0, 0, 1, 0, 0],
    'powerup': [0.42, 0, 260, 0, 0.12, 0.3, 0, 0, 8, 2, 0, 0, 0.03, 0, 0, 0.05, 0, 1, 0, 0],
    'sparkle': [0.28, 0.1, 1500, 0, 0, 0.18, 0, 1, 4, 0, 0, 0, 0.04, 0, 0, 0, 0, 0.7, 0, 0],
    'zap':     [0.5, 0.05, 920, 0, 0, 0.2, 3, 1, -12, -6, 0, 0, 0, 0.18, 0, 0.1, 0, 1, 0, 0],
    'swell':   [0.3, 0, 220, 0.08, 0, 0.35, 0, 1.4, 6, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0.12, 0],

    // — motion / animation-principle accents —
    // (these three double as bases for the parametric helpers below)
    'whoosh':  [0.34, 0.06, 700, 0.03, 0, 0.2, 0, 1, -9, -4, 0, 0, 0, 0.7, 0, 0, 0, 1, 0.06, 0],
    'impact':  [0.5, 0, 130, 0, 0.02, 0.2, 0, 1, -5, 0, 0, 0, 0, 0.12, 0, 0.05, 0, 1, 0.05, 0],
    'pop':     [0.4, 0, 380, 0, 0.02, 0.09, 0, 1, 6, 0, 0, 0, 0, 0, 0, 0.02, 0, 1, 0, 0],
    'boing':   [0.4, 0, 300, 0, 0.05, 0.28, 0, 1, 4, 0, 420, 0.06, 0.05, 0, 0, 0, 0, 1, 0, 0],
    'jump':    [0.45, 0, 330, 0, 0.04, 0.16, 0, 0, 14, 0, 0, 0, 0, 0, 0, 0.06, 0, 1, 0, 0],
    'thud':    [0.55, 0, 140, 0, 0.02, 0.22, 0, 1, -5, 0, 0, 0, 0, 0.1, 0, 0.05, 0, 1, 0.05, 0],
    'wobble':  [0.42, 0, 300, 0.01, 0.05, 0.5, 0, 1, 0, 0, 0, 0, 0.14, 0, 4, 0, 0, 1, 0, 0.6],
    'squeak':  [0.32, 0, 900, 0, 0, 0.09, 0, 1, 22, -34, 0, 0, 0, 0.04, 0, 0, 0, 1, 0, 0]
  };

  /* ── audio graph (created lazily on first gesture) ───────── */
  var AC = null, master = null, unlocked = false;
  var muted = load('foley.muted', false);
  var volume = load('foley.vol', 1); // 0..1 master scale (default = FORGE parity)

  function ensureContext() {
    if (AC) return AC;
    var Ctor = global.AudioContext || global.webkitAudioContext;
    if (!Ctor) return null;
    try {
      AC = new Ctor();
      master = AC.createGain();
      master.gain.value = muted ? 0 : volume;
      master.connect(AC.destination);
    } catch (e) { AC = null; }
    return AC;
  }

  function unlock() {
    var ctx = ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    unlocked = true;
  }

  /* ── reverb send bus (lazy) ──────────────────────────────────
     A ConvolverNode fed by a procedurally-generated impulse response
     (exponentially-decaying stereo noise) → a "space" tail with zero
     assets. Sounds opt in per-shot via opts.reverb (0..1 wet send). */
  var reverbBus = null;
  function buildReverbIR(ctx, seconds, decay) {
    var len = Math.floor(ctx.sampleRate * seconds);
    var ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = ir.getChannelData(ch);
      for (var i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return ir;
  }
  function ensureReverb() {
    if (reverbBus) return reverbBus;
    var ctx = ensureContext();
    if (!ctx || !ctx.createConvolver) return null;
    try {
      var conv = ctx.createConvolver();
      conv.buffer = buildReverbIR(ctx, 2.0, 2.6);
      var warm = ctx.createBiquadFilter(); warm.type = 'lowpass'; warm.frequency.value = 4200;
      var ret = ctx.createGain(); ret.gain.value = 1;
      conv.connect(warm); warm.connect(ret); ret.connect(master);
      reverbBus = conv;
    } catch (e) { reverbBus = null; }
    return reverbBus;
  }

  /* ── core playback ───────────────────────────────────────── */
  function playSamples(arr, opts) {
    if (muted) return null;
    var ctx = ensureContext();
    if (!ctx || !arr || !arr.length) return null;
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }

    var buf = ctx.createBuffer(1, arr.length, SR);
    buf.getChannelData(0).set(arr);
    var src = ctx.createBufferSource();
    src.buffer = buf;

    var node = src;
    // per-shot gain (opts.gain) and pan (opts.pan) without touching master
    if (opts && (opts.gain != null || opts.pan != null)) {
      if (opts.gain != null) {
        var g = ctx.createGain();
        g.gain.value = opts.gain;
        node.connect(g); node = g;
      }
      if (opts.pan != null && ctx.createStereoPanner) {
        var p = ctx.createStereoPanner();
        p.pan.value = Math.max(-1, Math.min(1, opts.pan));
        node.connect(p); node = p;
      }
    }
    if (opts && opts.rate != null) src.playbackRate.value = opts.rate;

    node.connect(master);
    // wet send to the reverb bus → "space" tail that spreads outward
    if (opts && opts.reverb) {
      var rb = ensureReverb();
      if (rb) { var sg = ctx.createGain(); sg.gain.value = opts.reverb; node.connect(sg); sg.connect(rb); }
    }
    var when = ctx.currentTime + (opts && opts.delay ? opts.delay / 1000 : 0);
    try { src.start(when); } catch (e) { return null; }
    return src;
  }

  /* ── public API ──────────────────────────────────────────── */
  var Foley = {
    /* Play a named palette sound. opts: {gain, rate, pan, delay(ms), reverb(0..1)} */
    play: function (name, opts) {
      var p = PALETTE[name];
      if (!p) { if (global.console) console.warn('[Foley] unknown sound:', name); return null; }
      return playSamples(zzfxG.apply(null, p), opts);
    },

    /* Play a raw 20-number ZzFX param array directly. */
    playParams: function (params, opts) {
      if (!params || !params.length) return null;
      return playSamples(zzfxG.apply(null, params), opts);
    },

    /* Parametric whoosh. velocity 0..1 → faster / brighter / louder.
       Great for anticipation → action, arcs, secondary action. */
    whoosh: function (velocity, opts) {
      var v = clamp01(velocity == null ? 0.5 : velocity);
      var p = [
        0.26 + 0.22 * v,   // volume
        0.06,              // randomness
        420 + 900 * v,     // frequency
        0.04 * (1 - v) + 0.015, // attack (slow whoosh = softer onset)
        0,                 // sustain
        0.24 - 0.1 * v,    // release (fast whoosh = shorter)
        0, 1,
        -6 - 10 * v,       // slide down
        -3 - 3 * v,        // deltaSlide
        0, 0, 0,
        0.55 + 0.35 * v,   // noise (air)
        0, 0, 0, 1, 0.06, 0
      ];
      return playSamples(zzfxG.apply(null, p), opts);
    },

    /* Parametric impact / landing. strength 0..1 → heavier / lower.
       Great for squash-and-stretch contact, timing, exaggeration hits. */
    impact: function (strength, opts) {
      var s = clamp01(strength == null ? 0.5 : strength);
      var p = [
        0.4 + 0.35 * s,    // volume
        0, 90 + 90 * (1 - s), // frequency (heavier = lower)
        0, 0.02,
        0.13 + 0.14 * s,   // release
        0, 1,
        -4 - 4 * s, 0, 0, 0, 0,
        0.08 + 0.16 * s,   // noise (body)
        0, 0.05, 0, 1, 0.05, 0
      ];
      return playSamples(zzfxG.apply(null, p), opts);
    },

    /* Register / override a named sound at runtime. */
    define: function (name, params) {
      if (name && params && params.length) PALETTE[name] = params.slice(0, 20);
      return this;
    },

    has: function (name) { return !!PALETTE[name]; },
    list: function () { return Object.keys(PALETTE); },

    /* Mute / volume — persisted to localStorage. */
    mute: function (v) {
      muted = (v == null) ? true : !!v;
      save('foley.muted', muted);
      if (master) master.gain.value = muted ? 0 : volume;
      return muted;
    },
    toggleMute: function () { return this.mute(!muted); },
    isMuted: function () { return muted; },
    setVolume: function (v) {
      volume = clamp01(v);
      save('foley.vol', volume);
      if (master && !muted) master.gain.value = volume;
      return volume;
    },
    getVolume: function () { return volume; },

    unlock: unlock,
    get context() { return AC; }
  };

  /* ── LIVE CHARGE VOICE ────────────────────────────────────
     A sustained, pitch-rising tone for "hold-to-charge" gestures
     (e.g. 09-exaggeration fireworks). Not a one-shot: it plays
     while held and its pitch tracks a 0..1 level in real time.
     A built-in warning beep layer swells in when `danger` > 0
     ("you're overdoing it — let go"). Single voice at a time.

       Foley.chargeStart();
       // every frame while held (level 0..1, danger 0..1):
       Foley.chargeSet(level, danger);
       // on release:
       Foley.chargeStop();  Foley.burst(power);
  */
  var chargeVoice = null;

  function buildChargeVoice() {
    var ctx = ensureContext();
    if (!ctx) return null;
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    var t = ctx.currentTime;

    // main rising tone (triangle → lowpass, light "キューん" — not a heavy saw)
    var osc = ctx.createOscillator(); osc.type = 'triangle';
    var oGain = ctx.createGain(); oGain.gain.value = 0;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 800; lp.Q.value = 6;
    osc.connect(oGain); oGain.connect(lp); lp.connect(master);

    // sub-octave body so low levels still feel weighty
    var sub = ctx.createOscillator(); sub.type = 'triangle';
    var sGain = ctx.createGain(); sGain.gain.value = 0;
    sub.connect(sGain); sGain.connect(master);

    // warning beep layer (square, gated on/off by a square LFO)
    var warn = ctx.createOscillator(); warn.type = 'square'; warn.frequency.value = 820;
    var wGain = ctx.createGain(); wGain.gain.value = 0;
    var wLFO = ctx.createOscillator(); wLFO.type = 'square'; wLFO.frequency.value = 8;
    var wLFOg = ctx.createGain(); wLFOg.gain.value = 0; // pulse depth (also = base → beep swings 0..2·depth)
    wLFO.connect(wLFOg); wLFOg.connect(wGain.gain);
    warn.connect(wGain); wGain.connect(master);

    osc.start(t); sub.start(t); warn.start(t); wLFO.start(t);
    return { ctx: ctx, osc: osc, oGain: oGain, lp: lp, sub: sub, sGain: sGain,
             warn: warn, wGain: wGain, wLFO: wLFO, wLFOg: wLFOg };
  }

  Foley.chargeStart = function () {
    if (muted) return;
    if (chargeVoice) this.chargeStop();
    chargeVoice = buildChargeVoice();
    if (!chargeVoice) return;
    // No hard onset — chargeSet blooms the gain up from silence so the
    // intro stays restrained and the release burst is the payoff.
    this.chargeSet(0, 0);
  };

  Foley.chargeSet = function (level, danger) {
    if (!chargeVoice) return;
    var v = chargeVoice, t = v.ctx.currentTime;
    level = clamp01(level); danger = clamp01(danger);
    // exponential pitch rise, higher/lighter floor → "キューん" (not low "ブーン")
    var base = 240 * Math.pow(6.5, level);   // ~240Hz → ~1560Hz
    v.osc.frequency.setTargetAtTime(base, t, 0.03);
    v.sub.frequency.setTargetAtTime(base * 0.5, t, 0.03);
    // muffled + near-silent at the intro, opening/blooming toward the top
    v.lp.frequency.setTargetAtTime(360 + level * 5600, t, 0.04);
    v.oGain.gain.setTargetAtTime(0.009 + level * 0.11, t, 0.06); // a touch quieter
    v.sGain.gain.setTargetAtTime(level * 0.025, t, 0.06);        // minimal low end → no ブーン weight
    // warning beep: a nudge, not a siren — stays under the burst
    if (danger > 0) {
      var depth = 0.028 + danger * 0.06;
      v.wLFO.frequency.setTargetAtTime(6 + danger * 10, t, 0.02);
      v.warn.frequency.setTargetAtTime(700 + danger * 620, t, 0.02);
      v.wLFOg.gain.setTargetAtTime(depth, t, 0.03);
      v.wGain.gain.setTargetAtTime(depth, t, 0.03);
    } else {
      v.wLFOg.gain.setTargetAtTime(0, t, 0.05);
      v.wGain.gain.setTargetAtTime(0, t, 0.05);
    }
  };

  Foley.chargeStop = function () {
    if (!chargeVoice) return;
    var v = chargeVoice, t = v.ctx.currentTime, stopT = t + 0.1;
    [v.oGain, v.sGain, v.wGain].forEach(function (g) {
      g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0, t, 0.02);
    });
    [v.osc, v.sub, v.warn, v.wLFO].forEach(function (o) { try { o.stop(stopT); } catch (e) {} });
    chargeVoice = null;
  };

  Foley.charging = function () { return !!chargeVoice; };

  /* ── BURST — layered firework explosion ("はじけ散る") ─────
     power 0..1 → boom weight + crackle density + sparkle tail.
       Foley.burst(power);
  */
  function crackleParams() {
    return [0.4, 0.4, 850 + Math.random() * 1500, 0, 0,
            0.02 + Math.random() * 0.045, 0, 1, -2, 0, 0, 0, 0,
            0.6, 0, 0.08, 0, 1, 0, 0];
  }
  // a bright high twinkle (sine, quick shimmer) for the sparkle shower
  function twinkleParams() {
    return [0.3, 0.15, 1600 + Math.random() * 1500, 0, 0,
            0.05 + Math.random() * 0.08, 0, 1, 4 + Math.random() * 9, 0, 0, 0, 0,
            0, 0, 0, 0, 0.7, 0, 0];
  }
  Foley.burst = function (power, opts) {
    if (muted) return;
    var pw = clamp01(power == null ? 0.8 : power);
    var g = (opts && opts.gain != null) ? opts.gain : 1;
    // 1) crisp "パーン" crack — peaky + high + transparent (low noise = crystalline).
    //    Bright body crack + ultra-short high snap + a clean high sine "ping".
    this.playParams([0.66, 0.03, 900, 0, 0, 0.055, 0, 1, 18, 0, 0, 0, 0, 0.07, 0, 0.02, 0, 1, 0, 0],
      { gain: (0.95 + 0.35 * pw) * g });
    this.playParams([0.6, 0.04, 2200, 0, 0, 0.024, 0, 1, 12, 0, 0, 0, 0, 0.08, 0, 0.015, 0, 1, 0, 0],
      { gain: (0.62 + 0.28 * pw) * g });
    // crystal ping — clean high sine with a short ring → 透明感 / glassy sparkle
    this.playParams([0.5, 0.02, 2800, 0.002, 0, 0.12, 0, 1, 7, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0.04, 0],
      { gain: (0.4 + 0.28 * pw) * g });
    // barely-there airy body — a breath of weight, not a boom
    this.playParams([0.24, 0.25, 200, 0, 0, 0.09, 0, 1, -3, 0, 0, 0, 0, 0.5, 0, 0, 0, 1, 0.05, 0],
      { gain: 0.16 * g, delay: 6 });
    // 2) SPARKLE SHOWER — the star. dense, loud, wide, long lingering shimmer (~2s).
    var n = Math.round(34 + pw * 82);
    for (var i = 0; i < n; i++) {
      var late = Math.random();                       // bias some later → shimmer lingers
      var d = 16 + late * late * (700 + pw * 1300);
      var pan = (Math.random() * 2 - 1) * 0.94;
      var gn = (0.12 + Math.random() * 0.2 * pw) * g;
      if (Math.random() < 0.5) {
        this.play('pop', { delay: d, pan: pan, gain: gn, rate: 1.8 + Math.random() * 2.0 });
      } else {
        this.playParams(twinkleParams(), { delay: d, pan: pan, gain: gn });
      }
    }
    // 3) fine "powder" dust — many tiny high crackle ticks → richness, long tail
    var dust = Math.round(18 + pw * 54);
    for (var k = 0; k < dust; k++) {
      this.playParams(crackleParams(), {
        delay: 14 + Math.random() * (560 + pw * 1200),
        pan: (Math.random() * 2 - 1) * 0.97,
        gain: (0.06 + Math.random() * 0.13 * pw) * g,
        rate: 1.0 + Math.random() * 1.4
      });
    }
  };

  /* ── DRONE — persistent low "ブーン" ambient bed ──────────
     A continuous detuned hum for glitch / sci-fi environments
     (e.g. 07-secondary-action). One bed at a time.
       Foley.droneStart();
       Foley.droneSet(level);   // 0..1 — swell with world energy
       Foley.droneStop();
  */
  var droneVoice = null;

  Foley.droneStart = function () {
    if (muted || droneVoice) return;
    var ctx = ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    var t = ctx.currentTime;
    // two slightly detuned saws → slow beating = movement; sub sine for weight
    var o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 62;
    var o2 = ctx.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = 62 * 1.008;
    var subo = ctx.createOscillator(); subo.type = 'sine'; subo.frequency.value = 31;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 240; lp.Q.value = 3;
    var dGain = ctx.createGain(); dGain.gain.value = 0;
    o1.connect(lp); o2.connect(lp); subo.connect(lp); lp.connect(dGain); dGain.connect(master);
    // slow filter wobble for a living, unstable feel
    var lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.13;
    var lfoG = ctx.createGain(); lfoG.gain.value = 70;
    lfo.connect(lfoG); lfoG.connect(lp.frequency);
    o1.start(t); o2.start(t); subo.start(t); lfo.start(t);
    droneVoice = { ctx: ctx, o1: o1, o2: o2, subo: subo, lp: lp, dGain: dGain, lfo: lfo, lfoG: lfoG };
    dGain.gain.setTargetAtTime(0.05, t, 0.4); // fade in
    this.droneSet(0.4);
  };

  Foley.droneSet = function (level) {
    if (!droneVoice) return;
    var v = droneVoice, t = v.ctx.currentTime;
    level = clamp01(level);
    v.dGain.gain.setTargetAtTime(0.03 + level * 0.06, t, 0.15);
    v.lp.frequency.setTargetAtTime(200 + level * 420, t, 0.2);
  };

  Foley.droneStop = function () {
    if (!droneVoice) return;
    var v = droneVoice, t = v.ctx.currentTime, stopT = t + 0.5;
    v.dGain.gain.cancelScheduledValues(t); v.dGain.gain.setTargetAtTime(0, t, 0.15);
    [v.o1, v.o2, v.subo, v.lfo].forEach(function (o) { try { o.stop(stopT); } catch (e) {} });
    droneVoice = null;
  };

  Foley.droning = function () { return !!droneVoice; };

  /* ── GLITCH — one-shot digital chirp ("ビ / ジ") ───────────
     ONE cohesive timbre (bit-crushed square) with small variation so a
     stream reads as "the same device", not a zoo of random beeps.
     opts.mode ('sync'|'only'|'mute') gives each context its own colour.
       Foley.glitch(intensity, { mode: 'sync' });
  */
  Foley.glitch = function (intensity, opts) {
    if (muted) return;
    var it = clamp01(intensity == null ? 0.6 : intensity);
    var g = ((opts && opts.gain != null) ? opts.gain : 1) * (0.2 + it * 0.5);
    var pan = (Math.random() * 2 - 1) * 0.7;
    var mode = opts && opts.mode;
    var freq, crush, rel, noise, rep = 0;
    if (mode === 'mute') {
      // dead screen — faint, dull, low data packets
      freq = 220 + Math.random() * 240; crush = 0.3; rel = 0.03 + Math.random() * 0.02;
      noise = 0.05; g *= 0.6;
    } else if (mode === 'only') {
      // orphaned echo — hollow mid blips, no primary anchor
      freq = 520 + Math.random() * 340; crush = 0.18; rel = 0.05 + Math.random() * 0.03;
      noise = 0.08;
    } else if (mode === 'sync') {
      // corruption — harsher, higher, occasional stutter
      freq = 720 + Math.random() * 620; crush = 0.12; rel = 0.03 + Math.random() * 0.035;
      noise = 0.18; rep = Math.random() < 0.35 ? 0.015 + Math.random() * 0.018 : 0;
    } else {
      // normal ambient bloom — mid band
      freq = 480 + Math.random() * 460; crush = 0.16; rel = 0.03 + Math.random() * 0.03;
      noise = 0.1;
    }
    this.playParams([0.4, 0.05, freq, 0, 0, rel, 2, 1, 0, 0, 0, 0, rep, noise, 0, crush, 0, 1, 0, 0],
      { gain: g, pan: pan });
  };

  /* ── SCAN — rising resonant sweep with a "ブワン、ン、ン" tail ──
     Bottom→top scan that spreads wide and resonates outward (not an echo —
     a high-Q resonance whose tremolo slows as it decays). Reads as a signal
     radiating into the surrounding world → good "secondary action" cue.
       Foley.scan({ gain: 0.42 });
  */
  Foley.scan = function (opts) {
    if (muted) return;
    var ctx = ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    var t = ctx.currentTime;
    var g0 = (opts && opts.gain != null) ? opts.gain : 0.5;
    var dur = 0.95;
    // two slightly detuned, oppositely-panned voices → width / "spreading"
    [-0.6, 0.6].forEach(function (panPos, idx) {
      var det = idx === 0 ? 0.995 : 1.005;
      var osc = ctx.createOscillator(); osc.type = 'sawtooth';
      var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 9;
      var amp = ctx.createGain(); amp.gain.value = 0;
      osc.connect(bp); bp.connect(amp);
      if (ctx.createStereoPanner) {
        var pn = ctx.createStereoPanner(); pn.pan.value = panPos;
        amp.connect(pn); pn.connect(master);
      } else { amp.connect(master); }
      // rising sweep (bottom → top): 140 → 820 Hz, then settle
      osc.frequency.setValueAtTime(140 * det, t);
      osc.frequency.exponentialRampToValueAtTime(820 * det, t + 0.32);
      osc.frequency.setTargetAtTime(700 * det, t + 0.34, 0.35);
      bp.frequency.setValueAtTime(220, t);
      bp.frequency.exponentialRampToValueAtTime(1200, t + 0.32);
      bp.frequency.setTargetAtTime(520, t + 0.4, 0.4);
      // amp envelope: quick swell, then a long resonant decay
      amp.gain.setValueAtTime(0, t);
      amp.gain.linearRampToValueAtTime(g0, t + 0.04);
      amp.gain.setTargetAtTime(0, t + 0.16, 0.3);
      // tremolo LFO → "ブワン、ン、ン"; it slows as the tail decays
      var lfo = ctx.createOscillator(); lfo.type = 'sine';
      var lfoG = ctx.createGain(); lfoG.gain.value = 0;
      lfo.connect(lfoG); lfoG.connect(amp.gain);
      lfo.frequency.setValueAtTime(9, t);
      lfo.frequency.setTargetAtTime(3.5, t + 0.2, 0.4);
      lfoG.gain.setValueAtTime(0, t + 0.05);
      lfoG.gain.linearRampToValueAtTime(g0 * 0.5, t + 0.12);
      lfoG.gain.setTargetAtTime(0, t + 0.3, 0.45);
      osc.start(t); lfo.start(t);
      osc.stop(t + dur); lfo.stop(t + dur);
    });
  };

  /* ── FLASH — bright "パ" snap for a visual flash / invert ── */
  Foley.flash = function (strength, opts) {
    if (muted) return;
    var s = clamp01(strength == null ? 0.7 : strength);
    var g = ((opts && opts.gain != null) ? opts.gain : 1) * (0.35 + s * 0.5);
    // bright noise+tone transient, quick downward snap
    this.playParams([0.5, 0.1, 1100 + s * 700, 0, 0, 0.05, 3, 1, -9, 0, 0, 0, 0,
      0.4, 0, 0.05, 0, 1, 0.02, 0], { gain: g });
  };

  /* ── GLIDE — continuous motion tone (sonified velocity) ───
     A held tone whose pitch tracks a SIGNED velocity: +1 = fast rise
     (pitch climbs, "ギューん"), -1 = fast fall (pitch drops, "ぴゅーん").
     Gain follows |velocity| so it breathes — quiet at the slow beats,
     louder through the fast middle. Perfect for a timing/spacing demo.
       Foley.glideStart();
       // every frame:  Foley.glideSet(velSm * scrollDir / peak);
       Foley.glideStop();
  */
  var glideVoice = null;

  Foley.glideStart = function (opts) {
    if (muted || glideVoice) return;
    var ctx = ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    var t = ctx.currentTime;
    var osc = ctx.createOscillator(); osc.type = (opts && opts.type) || 'triangle';
    var g = ctx.createGain(); g.gain.value = 0;
    osc.connect(g); g.connect(master);
    osc.start(t);
    glideVoice = {
      ctx: ctx, osc: osc, g: g,
      base: (opts && opts.base) || 330,   // Hz at zero velocity
      ratio: (opts && opts.ratio) || 3,   // pitch multiply at |vel|=1
      max: (opts && opts.gain) || 0.09    // gain at |vel|=1
    };
  };

  Foley.glideSet = function (signedVel) {
    if (!glideVoice) return;
    var v = glideVoice, t = v.ctx.currentTime;
    var sv = signedVel < -1 ? -1 : signedVel > 1 ? 1 : (signedVel || 0);
    var freq = v.base * Math.pow(v.ratio, sv);       // +vel → up, -vel → down
    v.osc.frequency.setTargetAtTime(freq, t, 0.04);
    v.g.gain.setTargetAtTime(Math.abs(sv) * v.max, t, 0.05); // breathe with speed
  };

  Foley.glideStop = function () {
    if (!glideVoice) return;
    var v = glideVoice, t = v.ctx.currentTime, st = t + 0.12;
    v.g.gain.cancelScheduledValues(t); v.g.gain.setTargetAtTime(0, t, 0.03);
    try { v.osc.stop(st); } catch (e) {}
    glideVoice = null;
  };

  Foley.gliding = function () { return !!glideVoice; };

  /* ── helpers ─────────────────────────────────────────────── */
  function clamp01(x) { x = +x; return x < 0 ? 0 : x > 1 ? 1 : (x || 0); }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function load(k, d) { try { var s = localStorage.getItem(k); return s == null ? d : JSON.parse(s); } catch (e) { return d; } }

  /* ── auto-unlock on first user gesture (autoplay policy) ──── */
  var gestures = ['pointerdown', 'mousedown', 'touchstart', 'keydown'];
  function onFirstGesture() {
    unlock();
    gestures.forEach(function (ev) { global.removeEventListener(ev, onFirstGesture); });
  }
  gestures.forEach(function (ev) {
    global.addEventListener(ev, onFirstGesture, { passive: true });
  });

  global.Foley = Foley;
})(typeof window !== 'undefined' ? window : this);

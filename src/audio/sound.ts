/**
 * Procedural Web Audio, zero asset files.
 *
 * Every pitched sound is drawn from a C major pentatonic scale, so no
 * two sounds can ever clash no matter how fast a child triggers them.
 * That matters: in a game aimed at five-year-olds, mashing is the
 * expected input mode.
 */

let ctx: AudioContext | null = null
let master: GainNode | null = null
let enabled = true

/** C major pentatonic across three octaves. */
const PENT = [
  261.63, 293.66, 329.63, 392.0, 440.0,
  523.25, 587.33, 659.25, 783.99, 880.0,
  1046.5, 1174.66, 1318.51, 1567.98, 1760.0,
]

function ac(): AudioContext | null {
  if (!enabled) return null
  if (!ctx) {
    const C = window.AudioContext ?? (window as any).webkitAudioContext
    if (!C) return null
    ctx = new C()
    master = ctx.createGain()
    master.gain.value = 0.62
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export function setAudioEnabled(on: boolean) {
  enabled = on
  if (master) master.gain.value = on ? 0.62 : 0
}
export function audioEnabled() { return enabled }

/** Unlock audio on the first user gesture (browser autoplay policy). */
export function primeAudio() { ac() }

/** Dev-only window hook, so audio problems can be inspected live. */
export function audioDebug() {
  return {
    enabled,
    ctxExists: !!ctx,
    ctxState: ctx ? ctx.state : 'none',
    masterGain: master ? master.gain.value : null,
    sampleRate: ctx ? ctx.sampleRate : null,
  }
}

/**
 * Browsers refuse to start audio until the user has interacted, and the
 * game can be entered from several places. Rather than remembering to
 * prime on every entry point, arm one listener for the first gesture
 * anywhere: miss it and the whole game is silent.
 */
export function armAudioOnFirstGesture() {
  if (typeof window === 'undefined') return
  const unlock = () => {
    primeAudio()
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
  }
  window.addEventListener('pointerdown', unlock, { once: false })
  window.addEventListener('keydown', unlock, { once: false })
}

type ToneOpts = { type?: OscillatorType; dur?: number; gain?: number; detune?: number; delay?: number }

function tone(freq: number, o: ToneOpts = {}) {
  const c = ac(); if (!c || !master) return
  const { type = 'sine', dur = 0.28, gain = 0.5, detune = 0, delay = 0 } = o
  const t0 = c.currentTime + delay
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (detune) osc.detune.setValueAtTime(detune, t0)
  // Percussive ADSR: fast attack, exponential tail.
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g); g.connect(master)
  osc.start(t0); osc.stop(t0 + dur + 0.05)
}

function noise(dur = 0.18, cutoff = 1400, gain = 0.35, delay = 0) {
  const c = ac(); if (!c || !master) return
  const t0 = c.currentTime + delay
  const frames = Math.floor(c.sampleRate * dur)
  const buf = c.createBuffer(1, frames, c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < frames; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / frames)
  const src = c.createBufferSource(); src.buffer = buf
  const filt = c.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.setValueAtTime(cutoff, t0)
  const g = c.createGain()
  g.gain.setValueAtTime(gain, t0)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  src.connect(filt); filt.connect(g); g.connect(master)
  src.start(t0)
}

/* ── the sound palette ───────────────────────────────────────── */

/**
 * Picking up an orb. Climbs the scale with each one taken, so a run of
 * selections sounds like progress rather than the same tick repeated.
 */
export const sPop = (step = 0) => {
  const i = Math.min(4 + step, PENT.length - 3)
  tone(PENT[i]!, { type: 'triangle', dur: 0.22, gain: 0.62 })
  tone(PENT[i + 2]!, { type: 'sine', dur: 0.30, gain: 0.40, delay: 0.05 })
  noise(0.06, 2600, 0.20)
}

/**
 * Every tap makes a sound, not just the ones inside a puzzle.
 * Menu buttons and the top bar were silent, which made the whole game
 * feel mute to anyone who clicked around before starting a round.
 */
export const sTap = () => {
  /*
    Reported as "no sound" twice, and both times the oscillators were
    firing correctly. The bug was loudness, not wiring: a 70ms blip at
    587Hz is nearly inaudible on a laptop speaker, which is where this
    game actually gets played. It now has a body note underneath, a
    brighter tick on top, and about twice the length.
  */
  tone(PENT[3]!, { type: 'triangle', dur: 0.14, gain: 0.62 })
  tone(PENT[8]!, { type: 'sine', dur: 0.08, gain: 0.30 })
  noise(0.05, 2600, 0.26)
}

/** Light UI tick, orb picked up. */
export const sLift    = () => tone(PENT[7]!, { type: 'triangle', dur: 0.09, gain: 0.18 })
/** Orb dropped onto the anvil. */
export const sPlace   = () => { tone(PENT[3]!, { type: 'triangle', dur: 0.14, gain: 0.3 }); noise(0.07, 900, 0.14) }
/** The hammer lands. Metal on metal. */
export const sStrike  = () => { noise(0.22, 2600, 0.5); tone(96, { type: 'sine', dur: 0.3, gain: 0.55 }); tone(150, { type: 'square', dur: 0.1, gain: 0.14 }) }
/** Two orbs fuse into one. */
export const sFuse    = () => { noise(0.3, 1800, 0.4); tone(PENT[4]!, { type: 'sine', dur: 0.4, gain: 0.4 }); tone(PENT[7]!, { type: 'sine', dur: 0.5, gain: 0.3, delay: 0.05 }) }
/** A successful forge. Rising pentatonic flourish. */
export const sForged  = () => [0, 2, 4, 7].forEach((s, i) => tone(PENT[4 + s]!, { type: 'triangle', dur: 0.42, gain: 0.34, delay: i * 0.065 }))
/** Not-yet. Soft, low, two notes, never harsh, never a buzzer. */
export const sNotYet  = () => { tone(PENT[2]!, { type: 'sine', dur: 0.26, gain: 0.24 }); tone(PENT[0]!, { type: 'sine', dur: 0.42, gain: 0.22, delay: 0.13 }) }
/** A star reaches mastery. */
export const sMastery = () => [0, 3, 5, 7, 9, 12].forEach((s, i) => tone(PENT[Math.min(s + 3, PENT.length - 1)]!, { type: 'sine', dur: 0.65, gain: 0.3, delay: i * 0.08 }))
/** Strategy token awarded. */
export const sToken   = () => { tone(PENT[9]!, { type: 'triangle', dur: 0.2, gain: 0.3 }); tone(PENT[12]!, { type: 'triangle', dur: 0.3, gain: 0.24, delay: 0.08 }) }
/** Repair scene beat advances. */
export const sBeat    = () => tone(PENT[6]!, { type: 'sine', dur: 0.2, gain: 0.22 })
/** Keypad digit. */
export const sKey     = (n: number) => tone(PENT[3 + (n % 5)]!, { type: 'triangle', dur: 0.08, gain: 0.16 })
/** Cleave, a bright shear. */
export const sCleave  = () => { noise(0.16, 5200, 0.36); tone(PENT[11]!, { type: 'triangle', dur: 0.22, gain: 0.26 }) }
/** Stamp press. */
export const sStamp   = () => { noise(0.12, 1100, 0.3); tone(PENT[2]!, { type: 'square', dur: 0.1, gain: 0.14 }) }

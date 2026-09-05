import { SKILL_BY_ID } from './skills'
import type { Order, Skill, Verb } from './types'
import { fmt, article } from './format'

/* ── random helpers ──────────────────────────────────────────── */
let seq = 0
const rid = () => `o${++seq}_${Math.random().toString(36).slice(2, 7)}`
const ri = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)]!
const shuffle = <T,>(xs: T[]): T[] => {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/* ── ore tray construction ───────────────────────────────────── */
/**
 * Ore tray for a BOND order: the winning pair, plus plausible decoys.
 *
 * Deliberately an array, not a Set. A double (2 + 2 = 4) needs both
 * twos on the tray, and a Set collapsed them into one, which made the
 * order literally unsolvable.
 */
function fuseOre(a: number, b: number, target: number, count = 6): number[] {
  const ore = [a, b]
  let guard = 0
  while (ore.length < count && guard++ < 120) {
    const d = ri(1, Math.max(3, Math.min(target, 12)))
    if (ore.includes(d)) continue
    // A decoy must not form a second winning pair with anything already
    // on the tray, or the order stops being diagnostic.
    if (ore.some((o) => o + d === target)) continue
    ore.push(d)
  }
  return shuffle(ore)
}

/* ── per-verb builders ───────────────────────────────────────── */

/**
 * Addition comes in two shapes, and conflating them was a real bug.
 *
 * A BOND states the total and asks which two numbers make it, so the
 * answer is the pair the child picks. Asking them to also type the
 * total would be asking them to copy a number off the screen.
 *
 * A SUM states the two numbers and asks for the total, which is
 * genuinely unknown, so that one is typed.
 */
function buildFuse(skill: Skill, a: number, b: number, mode: 'bond' | 'sum' = 'bond'): Order {
  const target = a + b
  if (mode === 'sum') {
    return {
      id: rid(), skillId: skill.id, verb: 'fuse', target, mode: 'sum',
      ore: [a, b], pieces: 2,
      prompt: `Add ${a} and ${b}`,
      sentence: { a, b, op: '+', answer: target },
    }
  }
  return {
    id: rid(), skillId: skill.id, verb: 'fuse', target, mode: 'bond',
    ore: fuseOre(a, b, target), pieces: 2,
    prompt: `Make ${article(target)} ${target}`,
    sentence: { a, b, op: '+', answer: target },
  }
}

function buildCleave(skill: Skill, source: number, keep: number): Order {
  return {
    id: rid(), skillId: skill.id, verb: 'cleave', target: source - keep,
    ore: [], source,
    prompt: `Subtract ${keep} from ${source}`,
    sentence: { a: source, b: keep, op: '-', answer: source - keep },
  }
}

function buildStamp(skill: Skill, rows: number, cols: number): Order {
  return {
    id: rid(), skillId: skill.id, verb: 'stamp', target: rows * cols,
    ore: [rows, cols],
    prompt: `Multiply ${rows} by ${cols}`,
    sentence: { a: rows, b: cols, op: '×', answer: rows * cols },
  }
}

function buildShare(skill: Skill, total: number, groups: number): Order {
  return {
    id: rid(), skillId: skill.id, verb: 'share', target: Math.floor(total / groups),
    ore: [], source: total, groups,
    prompt: `Divide ${total} into ${groups} equal groups`,
    sentence: { a: total, b: groups, op: '÷', answer: Math.floor(total / groups) },
  }
}

/**
 * The same fraction, in whichever picture this order calls for.
 *
 * Rotating the model is the point: a child who only ever meets fractions
 * as a shaded strip learns that strip, not the fraction. The wording has
 * to follow the picture, so it is derived here rather than hard-coded.
 */
function buildTemper(
  skill: Skill, denom: number, take: number,
  shape: 'bar' | 'pizza' | 'line' = 'bar',
  frac2?: { n: number; d: number },
  fracTask?: 'equiv' | 'add' | 'mult',
): Order {
  const noun = shape === 'pizza' ? 'pizza' : 'bar'
  const piece = shape === 'pizza' ? 'slices' : 'pieces'
  const plain =
    shape === 'line' ? `Hop to ${take} of ${denom} along the line`
    : `Cut the ${noun} into ${denom} ${piece}. Take ${take}`
  // When there are two fractions in play, the words have to name the job.
  const prompt =
    !frac2 ? plain
    : fracTask === 'equiv' ? `Show the same as ${frac2.n}/${frac2.d}, using ${denom} ${piece}`
    : fracTask === 'add'   ? `Put ${frac2.n}/${frac2.d} and ${take - frac2.n}/${denom} together`
    : fracTask === 'mult'  ? `Take ${frac2.n}/${frac2.d} of ${1}/${denom / frac2.d}`
    : plain
  return {
    id: rid(), skillId: skill.id, verb: 'temper', target: take,
    ore: [], denom, shape, frac2, fracTask,
    prompt,
    sentence: { a: take, b: denom, op: '÷', answer: take },
  }
}

/** Pick a fraction picture for this order, spread evenly across the three. */
function fracShape(): 'bar' | 'pizza' | 'line' {
  return pick(['bar', 'pizza', 'line'] as const)
}

/* ── skill-specific generators ───────────────────────────────── */

type Gen = (s: Skill) => Order

const GENERATORS: Record<string, Gen> = {
  // Kindergarten
  'k.count10': (s) => { const a = ri(1, 5), b = ri(1, 5); return buildFuse(s, a, b) },
  'k.bond5':   (s) => { const a = ri(1, 4); return buildFuse(s, a, 5 - a) },
  'k.add5':    (s) => { const a = ri(1, 4); return buildFuse(s, a, ri(1, 5 - a)) },
  'k.bond10':  (s) => { const a = ri(1, 9); return buildFuse(s, a, 10 - a) },
  'k.sub5':    (s) => { const src = ri(3, 5); return buildCleave(s, src, ri(1, src - 1)) },
  'k.teen':    (s) => { const n = ri(11, 19); return buildCleave(s, n, 10) },

  // Grade 1
  'g1.add10':   (s) => { const a = ri(2, 7); return buildFuse(s, a, ri(1, 10 - a)) },
  'g1.sub10':   (s) => { const src = ri(6, 10); return buildCleave(s, src, ri(1, src - 1)) },
  'g1.maketen': (s) => { const a = pick([7, 8, 9]); return buildFuse(s, a, ri(11 - a, 9), 'sum') },
  'g1.doubles': (s) => { const a = ri(3, 9); return buildFuse(s, a, pick([a, a + 1])) },
  'g1.sub20':   (s) => { const src = ri(12, 20); return buildCleave(s, src, ri(3, 9)) },
  'g1.place2':  (s) => { const n = ri(2, 5) * 10 + ri(1, 9); return buildCleave(s, n, Math.floor(n / 10) * 10) },

  // Grade 2
  'g2.add100': (s) => {
    const a = ri(2, 6) * 10 + ri(1, 4), b = ri(1, 3) * 10 + ri(1, 4)
    return buildFuse(s, a, b, 'sum')
  },
  'g2.carry':  (s) => {
    const a = ri(1, 6) * 10 + ri(5, 9), b = ri(1, 3) * 10 + ri(5, 9)
    return buildFuse(s, a, b, 'sum')  // ones always exceed 10 -> a carry is required
  },
  'g2.sub100': (s) => {
    const at = ri(4, 8), ao = ri(5, 9)
    return buildCleave(s, at * 10 + ao, ri(1, at - 2) * 10 + ri(1, ao - 1))
  },
  'g2.borrow': (s) => {
    const at = ri(3, 8), ao = ri(1, 4)
    return buildCleave(s, at * 10 + ao, ri(1, at - 2) * 10 + ri(ao + 1, 9))  // forces a borrow
  },
  'g2.skip':   (s) => buildStamp(s, ri(3, 8), pick([2, 5, 10])),
  'g2.arrays': (s) => buildStamp(s, ri(2, 5), ri(2, 6)),
  'g2.place3': (s) => { const n = ri(2, 9) * 100 + ri(1, 9) * 10 + ri(1, 9); return buildCleave(s, n, Math.floor(n / 100) * 100) },

  // Grade 3
  'g3.mult5':   (s) => buildStamp(s, ri(1, 5), ri(1, 9)),   // includes the 1x facts
  'g3.mult10':  (s) => buildStamp(s, pick([9, 10]), ri(2, 9)),
  'g3.mult9':   (s) => buildStamp(s, ri(6, 9), ri(4, 9)),
  'g3.div':     (s) => { const g = ri(2, 5), e = ri(2, 8); return buildShare(s, g * e, g) },
  'g3.family':  (s) => { const g = ri(3, 8), e = ri(3, 9); return buildShare(s, g * e, g) },
  'g3.add1000': (s) => { const a = ri(120, 480), b = ri(120, 390); return buildFuse(s, a, b, 'sum') },
  'g3.unitfrac':(s) => buildTemper(s, pick([2, 3, 4, 6]), 1, fracShape()),
  'g3.fraccomp':(s) => buildTemper(s, pick([3, 4, 6, 8]), 1, fracShape()),

  // Grade 4
  'g4.mult2x1':   (s) => buildStamp(s, ri(2, 9), ri(11, 19)),
  'g4.mult2x2':   (s) => buildStamp(s, ri(11, 19), ri(11, 15)),
  'g4.divrem':    (s) => { const g = ri(3, 6), e = ri(3, 8); return buildShare(s, g * e + ri(1, g - 1), g) },
  'g4.factors':   (s) => { const g = pick([3, 4, 6, 8]), e = ri(4, 9); return buildShare(s, g * e, g) },
  'g4.equivfrac': (s) => {
    // Show a simple fraction, ask for the same amount in finer pieces.
    const [d, k] = pick([[2, 2], [2, 3], [3, 2], [4, 2]] as const)
    const n = ri(1, d - 1)
    return buildTemper(s, d * k, n * k, fracShape(), { n, d }, 'equiv')
  },
  'g4.addlike':   (s) => {
    const d = pick([4, 5, 6, 8])
    const x = ri(1, d - 2), y = ri(1, d - 1 - x)
    return buildTemper(s, d, x + y, fracShape(), { n: y, d }, 'add')
  },

  // Grade 5
  'g5.addunlike': (s) => {
    // Halves/thirds/quarters against a denominator they divide into, so
    // the common denominator is reachable by cutting, not by algebra.
    const [d1, d2] = pick([[2, 4], [2, 6], [3, 6], [2, 8], [4, 8], [3, 9]] as const)
    // Keep the total under a whole, or the picture has nowhere to put it.
    const step = d2 / d1
    const n2 = ri(1, Math.max(1, d2 - step - 1))
    return buildTemper(s, d2, step + n2, fracShape(), { n: 1, d: d1 }, 'add')
  },
  'g5.multfrac':  (s) => {
    // A fraction OF a fraction: cut into d1, then cut one of those into d2.
    const d1 = pick([2, 3, 4]), d2 = pick([2, 3, 4])
    return buildTemper(s, d1 * d2, 1, fracShape(), { n: 1, d: d1 }, 'mult')
  },
  'g5.decplace':  (s) => {
    // Tenths as a position between 0 and 1, which is what a decimal is.
    const n = ri(1, 9)
    return { ...buildTemper(s, 10, n, 'line'), prompt: `Hop to ${fmt(n, 1)} on the line` }
  },
  'g5.decadd':    (s) => {
    // Held as whole tenths, shown as decimals. Ragged pairs on purpose:
    // 3.4 + 2.8 crosses a whole, which is the part children drop.
    const a = ri(12, 68), b = ri(12, 45)
    return { ...buildFuse(s, a, b, 'sum'), scale: 1, prompt: `Add ${fmt(a, 1)} and ${fmt(b, 1)}` }
  },
  'g5.div2':      (s) => { const g = ri(11, 18), e = ri(3, 9); return buildShare(s, g * e, g) },
  'g5.order':     (s) => {
    /*
      A genuine precedence decision. The child sees the whole expression
      but the orbs show it already reduced to its last step, so the
      lesson is visible: the multiply happened first.

      Left-to-right evaluation gives a different, plausible answer, which
      is exactly the wrong answer we want available to be chosen.
    */
    const a = ri(2, 9), b = ri(2, 9), c = ri(2, 9)
    const o = buildFuse(s, a, b * c, 'sum')
    return { ...o, expr: { text: `${a} + ${b} × ${c}`, steps: [`${b} x ${c} = ${b * c}`, `${a} + ${b * c}`] },
             prompt: `Work out ${a} + ${b} × ${c}` }
  },
  'g5.powers':    (s) => {
    // Actual scaling by a power of ten, with the power named in the words.
    const base = ri(2, 9), p = ri(1, 3), mult = 10 ** p
    const o = buildStamp(s, base, mult)
    // "Make 7 ten times bigger 1 time" is not a sentence anyone says.
    const again = p === 1 ? '' : p === 2 ? ', twice' : ', three times'
    return { ...o, prompt: `Make ${base} ten times bigger${again}` }
  },
  'g5.volume':    (s) => {
    // Volume needs the third dimension or it is just area with a new name.
    const r = ri(2, 4), c = ri(2, 5), l = ri(2, 4)
    const o = buildStamp(s, r, c)
    return {
      ...o, layers: l, target: r * c * l,
      prompt: `Stack ${l} layers of ${r} by ${c}`,
      sentence: { a: r * c, b: l, op: '×', answer: r * c * l },
    }
  },
}

/** Fallback generator when a skill has no bespoke rule. */
const FALLBACK: Record<Verb, Gen> = {
  fuse:   (s) => { const a = ri(2, 9); return buildFuse(s, a, ri(2, 9)) },
  cleave: (s) => { const src = ri(8, 20); return buildCleave(s, src, ri(2, src - 2)) },
  stamp:  (s) => buildStamp(s, ri(2, 8), ri(2, 9)),
  share:  (s) => { const g = ri(2, 6), e = ri(2, 8); return buildShare(s, g * e, g) },
  temper: (s) => buildTemper(s, pick([2, 3, 4, 6, 8]), 1),
}

/** Build one fresh order for a skill. */
export function makeOrder(skillId: string): Order {
  const skill = SKILL_BY_ID[skillId]
  if (!skill) throw new Error(`unknown skill: ${skillId}`)
  const gen = GENERATORS[skillId] ?? FALLBACK[skill.verb]
  return gen(skill)
}

/**
 * Verb presentation.
 *
 * Every name is a word a five-year-old already owns, one syllable, and
 * names something you can do with your hands. The old set (fuse, cleave,
 * temper) was written for an adult reading the pitch, "cleave" in
 * particular is archaic and famously means both split AND stick
 * together, which is exactly the wrong word for a child learning
 * subtraction. Iconography lives in `components/Icon.tsx`.
 */
/*
  The names a child already meets at school.

  These were invented forge words once (Mash, Snap, Stamp, Share, Slice).
  They read well, but a child who masters "mashing" has learned a word
  that appears on no worksheet anywhere, and the skill does not transfer.
  The internal verbs stay as they are; only what the child reads changed.
*/
export const VERB_META: Record<Verb, { name: string; op: string; blurb: string }> = {
  fuse:   { name: 'Add',      op: '+', blurb: 'Add two numbers together' },
  cleave: { name: 'Subtract', op: '−', blurb: 'Subtract to find what is left' },
  stamp:  { name: 'Multiply', op: '×', blurb: 'Multiply rows and columns' },
  share:  { name: 'Divide',   op: '÷', blurb: 'Divide into equal groups' },
  temper: { name: 'Fractions', op: '/', blurb: 'Cut a whole into equal parts' },
}

import { plural } from './format'
import type { Misconception, Order, RepairBeat } from './types'

/**
 * The Misconception Radar.
 *
 * A wrong answer is not noise, it is the single richest signal a
 * learner produces. Each rule below recognises a specific, documented
 * arithmetic bug and hands back a guided repair built from the same
 * forge verbs the child already knows.
 *
 * Rules are evaluated in order; the first match wins, so the most
 * diagnostic patterns are listed before the generic ones.
 *
 * `label` is written for a grown-up and appears only on the dashboard.
 * `kidLine` and every repair beat are written for a five-year-old:
 * short sentences, plain words, and never the word "wrong".
 */

const rods = (n: number) => [Math.floor(n / 10), n % 10]

/** Digit-wise sum with every carry discarded. 27 + 15 -> 32. */
export function noCarrySum(a: number, b: number): number {
  let out = 0, place = 1
  while (a > 0 || b > 0) {
    out += ((a % 10) + (b % 10)) % 10 * place
    a = Math.floor(a / 10); b = Math.floor(b / 10); place *= 10
  }
  return out
}

/** Digit-wise |difference|, the smaller-from-larger bug. 34 - 19 -> 25. */
export function smallerFromLarger(a: number, b: number): number {
  let out = 0, place = 1
  while (a > 0 || b > 0) {
    out += Math.abs((a % 10) - (b % 10)) * place
    a = Math.floor(a / 10); b = Math.floor(b / 10); place *= 10
  }
  return out
}

export const MISCONCEPTIONS: Record<string, Misconception> = {
  // ── Subtraction ────────────────────────────────────────────
  'sub.smaller-from-larger': {
    id: 'sub.smaller-from-larger',
    didWhat: 'took the small number away from the big one',
    label: 'Smaller-from-larger bug',
    kidLine: "I see what happened! You took the small number away from the big one every time.",
    repair: (o) => {
      const { a, b, answer } = o.sentence
      const [at, ao] = rods(a), [bt, bo] = rods(b)
      return [
        { text: `Let's do ${a} take away ${b} together.`, visual: 'rods', data: [at, ao], accent: 'cyan' },
        { text: `${a} is ${at} ten-stick${at === 1 ? '' : 's'} and ${ao} one${ao === 1 ? '' : 's'}. We need to take ${bo} ones… but we only have ${ao}!`, visual: 'rods', data: [at, ao, bo], accent: 'ember' },
        { text: `So we BREAK one ten-stick into 10 ones. Now we have ${at - 1} ten-sticks and ${ao + 10} ones.`, visual: 'rods', data: [at - 1, ao + 10], accent: 'violet' },
        { text: `${ao + 10} take ${bo} is ${ao + 10 - bo}. ${at - 1} ten-sticks take ${bt} is ${at - 1 - bt}. So ${a} − ${b} = ${answer}!`, visual: 'rods', data: rods(answer), accent: 'mint' },
      ]
    },
  },
  'sub.swapped': {
    id: 'sub.swapped',
    didWhat: 'added them instead of subtracting',
    label: 'Added instead of subtracting',
    kidLine: "You added them, but this one needs subtracting!",
    repair: (o) => {
      const { a, b, answer } = o.sentence
      return [
        { text: `Adding makes numbers bigger. Subtracting breaks them apart.`, visual: 'orbs', data: [a, b], accent: 'ember' },
        { text: `This one wants us to take ${b} away from ${a}.`, visual: 'numberline', data: [a, b, answer], accent: 'cyan' },
        { text: `Start at ${a} and hop back ${b}. We land on ${answer}!`, visual: 'numberline', data: [a, b, answer], accent: 'mint' },
      ]
    },
  },
  'sub.borrow-dropped': {
    id: 'sub.borrow-dropped',
    didWhat: 'forgot the ten-stick had lent one away',
    label: 'Regrouped the ones but not the tens',
    kidLine: "The ones were right! But the ten-sticks forgot they lent one out.",
    repair: (o) => {
      const { a, b, answer } = o.sentence
      const [at, ao] = rods(a)
      return [
        { text: `When a ten-stick gets broken up, it leaves the ten-stick pile.`, visual: 'rods', data: [at, ao], accent: 'ember' },
        { text: `${plural(at, 'ten-stick')} become ${at - 1} once we break one into ones.`, visual: 'rods', data: [at - 1, ao + 10], accent: 'violet' },
        { text: `Now the ten-sticks work out too. ${a} − ${b} = ${answer}!`, visual: 'rods', data: rods(answer), accent: 'mint' },
      ]
    },
  },

  // ── Addition ───────────────────────────────────────────────
  'add.carry-dropped': {
    id: 'add.carry-dropped',
    didWhat: 'forgot to turn ten ones into a ten-stick',
    label: 'Dropped the carry',
    kidLine: "Your ones added up past ten, and ten ones always turn into a ten-stick!",
    repair: (o) => {
      const { a, b, answer } = o.sentence
      const ones = (a % 10) + (b % 10)
      return [
        { text: `${plural(a % 10, 'one')} add to ${plural(b % 10, 'one')}. That makes ${plural(ones, 'one')}!`, visual: 'rods', data: [0, ones], accent: 'ember' },
        { text: `But ten ones can't stay loose! Ten ones make one ten-stick.`, visual: 'rods', data: [1, ones - 10], accent: 'violet' },
        { text: `That new ten-stick joins the pile. ${a} + ${b} = ${answer}!`, visual: 'rods', data: rods(answer), accent: 'mint' },
      ]
    },
  },
  'add.swapped': {
    id: 'add.swapped',
    didWhat: 'subtracted instead of adding',
    label: 'Subtracted instead of adding',
    kidLine: "You subtracted, but this one wants adding!",
    repair: (o) => {
      const { a, b, answer } = o.sentence
      return [
        { text: `This one wants ${a} and ${b} squashed together.`, visual: 'orbs', data: [a, b], accent: 'cyan' },
        { text: `Start at ${a} and hop forward ${b}.`, visual: 'numberline', data: [a, b, answer], accent: 'ember' },
        { text: `We land on ${answer}!`, visual: 'numberline', data: [a, b, answer], accent: 'mint' },
      ]
    },
  },
  'add.count-slip': {
    id: 'add.count-slip',
    didWhat: 'hopped one step too many',
    label: 'Counting slip, off by one',
    kidLine: "So close! It's easy to start counting one hop too early.",
    repair: (o) => {
      const { a, b, answer } = o.sentence
      return [
        { text: `Counting on from ${a}, the FIRST hop lands on ${a + 1}, not ${a}.`, visual: 'numberline', data: [a, b, answer], accent: 'ember' },
        { text: `Take all ${b} hops and we finish on ${answer}!`, visual: 'numberline', data: [a, b, answer], accent: 'mint' },
      ]
    },
  },

  // ── Multiplication ─────────────────────────────────────────
  'mult.added-instead': {
    id: 'mult.added-instead',
    didWhat: 'added them instead of multiplying',
    label: 'Added the factors',
    kidLine: "You added them. Multiplying makes rows and rows instead!",
    repair: (o) => {
      const { a, b, answer } = o.sentence
      return [
        { text: `${a} + ${b} joins two piles. ${a} × ${b} builds ${plural(a, 'row')} of ${b}!`, visual: 'array', data: [a, b], accent: 'ember' },
        { text: `Count every dot, row by row.`, visual: 'array', data: [a, b], accent: 'cyan' },
        { text: `${a} × ${b} = ${answer}.`, visual: 'array', data: [a, b], accent: 'mint' },
      ]
    },
  },
  'mult.skip-slip': {
    id: 'mult.skip-slip',
    didWhat: 'missed a whole row when counting',
    label: 'One row off when skip-counting',
    kidLine: "Oops, one whole row got missed when you counted!",
    repair: (o, given) => {
      const { a, b, answer } = o.sentence
      const missingRows = Math.round((answer - given) / b)
      return [
        { text: `You were ${missingRows > 0 ? 'one row short' : 'one row over'}. That is an easy slip!`, visual: 'array', data: [a, b], accent: 'ember' },
        { text: `Count the rows out loud: ${Array.from({ length: a }, (_, i) => (i + 1) * b).join(', ')}.`, visual: 'array', data: [a, b], accent: 'cyan' },
        { text: `All ${plural(a, 'row')} of ${b} make ${answer}.`, visual: 'array', data: [a, b], accent: 'mint' },
      ]
    },
  },
  'mult.adjacent-fact': {
    id: 'mult.adjacent-fact',
    didWhat: 'used the answer from a different times fact',
    label: 'Recalled a neighbouring fact',
    kidLine: "That's a real answer! It just belongs to a different times fact.",
    repair: (o) => {
      const { a, b, answer } = o.sentence
      return [
        { text: `We want ${plural(a, 'row')} of ${b}.`, visual: 'array', data: [a, b], accent: 'cyan' },
        { text: `Build it row by row and count.`, visual: 'array', data: [a, b], accent: 'ember' },
        { text: `${a} × ${b} = ${answer}.`, visual: 'array', data: [a, b], accent: 'mint' },
      ]
    },
  },

  // ── Division ───────────────────────────────────────────────
  'div.multiplied-instead': {
    id: 'div.multiplied-instead',
    didWhat: 'made it bigger instead of dividing',
    label: 'Multiplied instead of dividing',
    kidLine: "You made it bigger, but dividing makes each group smaller!",
    repair: (o) => {
      const { a, b, answer } = o.sentence
      return [
        { text: `We have ${plural(a, 'dot')} and ${plural(b, 'group')}.`, visual: 'orbs', data: [a], accent: 'cyan' },
        { text: `Share them out one at a time until the pile is empty.`, visual: 'array', data: [b, answer], accent: 'ember' },
        { text: `Each group holds ${answer}. ${a} ÷ ${b} = ${answer}!`, visual: 'array', data: [b, answer], accent: 'mint' },
      ]
    },
  },
  'div.reversed': {
    id: 'div.reversed',
    didWhat: 'divided it the wrong way round',
    label: 'Divided the wrong way round',
    kidLine: "The big number is the one we divide up, not the other way round!",
    repair: (o) => {
      const { a, b, answer } = o.sentence
      return [
        { text: `${a} is the pile. ${b} is how many groups.`, visual: 'orbs', data: [a, b], accent: 'ember' },
        { text: `Divide ${plural(a, 'dot')} into ${plural(b, 'group')}, the same in each.`, visual: 'array', data: [b, answer], accent: 'cyan' },
        { text: `Each group gets ${answer}!`, visual: 'array', data: [b, answer], accent: 'mint' },
      ]
    },
  },
  'div.remainder-dropped': {
    id: 'div.remainder-dropped',
    didWhat: 'forgot the bits left over',
    label: 'Ignored the leftover',
    kidLine: "Almost! Every group has to hold the SAME amount, so some are left over.",
    repair: (o) => {
      const { a, b, answer } = o.sentence
      const rem = a - answer * b
      return [
        { text: `${plural(b, 'group')} each took ${answer}. That's ${plural(answer * b, 'dot')}.`, visual: 'array', data: [b, answer], accent: 'cyan' },
        { text: `We started with ${a}, so ${rem} dot${rem === 1 ? '' : 's'} ${rem === 1 ? 'is' : 'are'} left over.`, visual: 'orbs', data: [rem], accent: 'ember' },
        { text: `${a} ÷ ${b} = ${answer}, with ${rem} left over!`, visual: 'array', data: [b, answer], accent: 'mint' },
      ]
    },
  },

  // ── Fractions ──────────────────────────────────────────────
  'frac.cuts-vs-parts': {
    id: 'frac.cuts-vs-parts',
    didWhat: 'counted the cuts instead of the pieces',
    label: 'Confused cuts with parts',
    kidLine: "Watch the cuts! Three cuts make FOUR pieces, not three.",
    repair: (o) => {
      const d = o.denom ?? 4
      return [
        { text: `To get ${d} equal pieces we make ${d - 1} cuts.`, visual: 'bar', data: [d], accent: 'ember' },
        { text: `Count the PIECES, not the cuts.`, visual: 'bar', data: [d], accent: 'cyan' },
        { text: `${plural(d, 'piece')}! Each one is one ${ordinalName(d)}.`, visual: 'bar', data: [d], accent: 'mint' },
      ]
    },
  },
  'frac.bigger-denominator': {
    id: 'frac.bigger-denominator',
    didWhat: 'thought more pieces meant bigger pieces',
    label: 'Bigger denominator means bigger piece',
    kidLine: "More pieces mean each piece is SMALLER, not bigger!",
    repair: (o) => {
      const d = o.denom ?? 4
      return [
        { text: `Here is one bar cut into ${d}, and the same bar cut into ${d + 2}.`, visual: 'bar', data: [d], accent: 'cyan' },
        { text: `The more times you slice it, the thinner each piece gets.`, visual: 'bar', data: [d + 2], accent: 'ember' },
        { text: `So 1/${d} is bigger than 1/${d + 2}!`, visual: 'bar', data: [d], accent: 'mint' },
      ]
    },
  },
  'frac.add-across': {
    id: 'frac.add-across',
    didWhat: 'added the bottom numbers too',
    label: 'Added numerators and denominators',
    kidLine: "The bottom number tells us how BIG each piece is. It never gets added!",
    repair: (o) => {
      const d = o.denom ?? 4
      return [
        { text: `The bottom number says how big each piece is.`, visual: 'bar', data: [d], accent: 'cyan' },
        { text: `Adding pieces of the same size only changes how MANY we have.`, visual: 'bar', data: [d], accent: 'ember' },
        { text: `The piece size stays ${d}ths!`, visual: 'bar', data: [d], accent: 'mint' },
      ]
    },
  },

  // ── Generic fallback ───────────────────────────────────────
  'generic.retry': {
    id: 'generic.retry',
    label: 'Not yet, no clear pattern',
    kidLine: "Not yet! Let's do it together, one step at a time.",
    repair: (o) => {
      const { a, b, op, answer } = o.sentence
      return [
        { text: `Let's take this one nice and slow: ${a} ${op} ${b}.`, visual: 'orbs', data: [a, b], accent: 'cyan' },
        { text: op === '×' || op === '÷'
            ? `Let's build it as rows so we can see it.`
            : `Let's hop it out on the number line.`,
          visual: op === '×' || op === '÷' ? 'array' : 'numberline', data: [a, b, answer], accent: 'ember' },
        { text: `${a} ${op} ${b} = ${answer}!`, visual: 'orbs', data: [answer], accent: 'mint' },
      ]
    },
  },
}

function ordinalName(d: number): string {
  const names: Record<number, string> = { 2: 'half', 3: 'third', 4: 'quarter', 5: 'fifth', 6: 'sixth', 8: 'eighth', 10: 'tenth' }
  return names[d] ?? `${d}th`
}

/**
 * Classify a wrong answer. Returns a misconception id, or undefined
 * when the answer is simply a random miss with no diagnostic shape.
 */
export function analyse(order: Order, given: number): string | undefined {
  const { a, b, op, answer } = order.sentence
  if (given === answer) return undefined
  const delta = given - answer

  switch (op) {
    case '-': {
      if (given === smallerFromLarger(a, b) && a >= 10) return 'sub.smaller-from-larger'
      if (given === a + b) return 'sub.swapped'
      if (Math.abs(delta) === 10) return 'sub.borrow-dropped'
      if (Math.abs(delta) === 1) return 'add.count-slip'
      break
    }
    case '+': {
      if (a >= 10 && given === noCarrySum(a, b) && given !== answer) return 'add.carry-dropped'
      if (given === Math.abs(a - b)) return 'add.swapped'
      if (Math.abs(delta) === 1) return 'add.count-slip'
      if (a >= 10 && Math.abs(delta) === 10) return 'add.carry-dropped'
      break
    }
    case '×': {
      if (given === a + b) return 'mult.added-instead'
      if (delta !== 0 && (Math.abs(delta) === a || Math.abs(delta) === b)) return 'mult.skip-slip'
      if (isProductNear(given, a, b)) return 'mult.adjacent-fact'
      break
    }
    case '÷': {
      if (given === a * b) return 'div.multiplied-instead'
      if (b !== 0 && given === b) return 'div.reversed'
      if (given === a - b) return 'div.reversed'
      // The quotient we ask for is already floored, so flooring is correct.
      // The real error is rounding UP to force every last orb into a crucible.
      if (a % b !== 0 && given === Math.ceil(a / b)) return 'div.remainder-dropped'
      break
    }
  }
  return 'generic.retry'
}

/** True when `given` is a legitimate product from a neighbouring table. */
function isProductNear(given: number, a: number, b: number): boolean {
  for (const da of [-1, 0, 1]) {
    for (const db of [-1, 0, 1]) {
      if (da === 0 && db === 0) continue
      const fa = a + da, fb = b + db
      if (fa > 0 && fb > 0 && fa * fb === given) return true
    }
  }
  return false
}

/** Fraction-specific analysis for TEMPER orders. */
export function analyseTemper(order: Order, slices: number, taken: number): string | undefined {
  const wantD = order.denom ?? 4
  const wantN = order.target
  if (slices === wantD && taken === wantN) return undefined
  if (slices === wantD - 1 || slices === wantD + 1) return 'frac.cuts-vs-parts'
  if (slices === wantN && taken === wantD) return 'frac.add-across'
  if (slices > wantD) return 'frac.bigger-denominator'
  return 'generic.retry'
}

export function misconceptionOf(id?: string): Misconception | undefined {
  return id ? MISCONCEPTIONS[id] : undefined
}

export type { RepairBeat }

/**
 * Produce the answer a given misconception would actually generate.
 * This is `analyse` run in reverse.
 *
 * Used to build wrong answers on purpose: Pip's mistakes when the child
 * is teaching, and the distractors in the answer choices, so every wrong
 * option a child can tap is a real reasoning bug rather than noise.
 */
export function wrongAnswerFor(order: Order, bugId: string): number | null {
  const { a, b, op, answer } = order.sentence
  switch (bugId) {
    case 'sub.smaller-from-larger': return op === '-' && a >= 10 ? smallerFromLarger(a, b) : null
    case 'sub.swapped':             return op === '-' ? a + b : null
    case 'sub.borrow-dropped':      return op === '-' ? answer + 10 : null
    case 'add.carry-dropped':       return op === '+' && a >= 10 ? noCarrySum(a, b) : null
    case 'add.swapped':             return op === '+' ? Math.abs(a - b) : null
    case 'add.count-slip':          return op === '+' || op === '-' ? answer + 1 : null
    case 'mult.added-instead':      return op === '×' ? a + b : null
    case 'mult.skip-slip':          return op === '×' ? answer - b : null
    case 'mult.adjacent-fact':      return op === '×' && a > 1 && b > 1 ? (a - 1) * (b + 1) : null
    case 'div.multiplied-instead':  return op === '÷' ? a * b : null
    case 'div.reversed':            return op === '÷' ? b : null
    case 'div.remainder-dropped':   return op === '÷' && a % b !== 0 ? Math.ceil(a / b) : null
    default: return null
  }
}

/**
 * The misconceptions specific enough to name and teach against.
 *
 * A shapeless miss (generic.retry) is not one of them: it says only that
 * the answer was wrong, which is no use as a diagnosis and would be
 * meaningless as an option in Teach Pip.
 */
export const DIAGNOSABLE: string[] = Object.values(MISCONCEPTIONS)
  .filter((m) => !!m.didWhat)
  .map((m) => m.id)

export function describeMiss(id: string): string {
  return MISCONCEPTIONS[id]?.didWhat ?? 'got it wrong'
}

import type { Order, Strategy } from './types'

/**
 * Strategy Tokens, the anti-timer.
 *
 * After a correct forge the smith is asked HOW they did it. Naming a
 * strategy pays more than answering quickly, and finding a *second*
 * strategy for a fact you already knew pays the most of all.
 *
 * This inverts the usual incentive of a maths game: we are rewarding
 * flexible thinking rather than fast recall, which is what actually
 * predicts later mathematical fluency.
 */

const crossesTen = (o: Order) => {
  const { a, b, op } = o.sentence
  return op === '+' && a % 10 !== 0 && (a % 10) + (b % 10) > 10
}

export const STRATEGIES: Strategy[] = [
  {
    id: 'make-ten',
    label: 'I made a ten',
    applies: (o) => crossesTen(o) || (o.sentence.op === '-' && o.sentence.a > 10),
  },
  {
    id: 'doubles',
    label: 'I used a double',
    applies: (o) => {
      const { a, b, op } = o.sentence
      return (op === '+' || op === '×') && Math.abs(a - b) <= 1
    },
  },
  {
    id: 'count-on',
    label: 'I counted on',
    applies: (o) => (o.sentence.op === '+' || o.sentence.op === '-') && Math.min(o.sentence.a, o.sentence.b) <= 4,
  },
  {
    id: 'skip-count',
    label: 'I skip-counted',
    applies: (o) => o.sentence.op === '×' || o.sentence.op === '÷',
  },
  {
    id: 'break-apart',
    label: 'I broke it apart',
    applies: (o) => o.sentence.a >= 10 || o.sentence.b >= 10,
  },
  {
    id: 'known-fact',
    label: 'I used a fact I know',
    applies: (o) => o.sentence.op === '×' || o.sentence.op === '÷' || o.sentence.a > 5,
  },
  {
    id: 'just-knew',
    label: 'I just knew it',
    applies: () => true,
  },
]

/** The 3 most plausible strategies for this order, plus "I just knew it". */
export function strategiesFor(order: Order): Strategy[] {
  const fits = STRATEGIES.filter((s) => s.id !== 'just-knew' && s.applies(order))
  const chosen = fits.slice(0, 3)
  return [...chosen, STRATEGIES.find((s) => s.id === 'just-knew')!]
}

export const SPARKS = {
  /** Base award for a correct forge. */
  forge: 10,
  /** Bonus for naming the strategy you used. */
  named: 15,
  /** Bonus for a strategy you have never used on this skill before. */
  novel: 40,
  /** Awarded when a repair scene is completed, effort is paid too. */
  repair: 8,
  /** Catching a bug: the biggest single award in the game. */
  catch: 60,
} as const

/**
 * What a hint costs.
 *
 * Priced so a hinted solve still nets a gain: pay 5, earn 10 back, keep 5.
 * Same economics as the old silent "you get 4 instead of 10", except the
 * child can now see the transaction instead of never noticing it.
 */
export const HINT_COST = 5

/**
 * A hint is never a barrier. A child who cannot afford one is a beginner,
 * which is exactly who needs help most, so the hint is still given and
 * simply takes whatever they have.
 *
 * The earlier rule waived the cost entirely and the button said "free".
 * That read as the price rather than as an exception, and since a child's
 * very first hint is always taken at zero stars, "hints are free" was the
 * first thing the game taught about them. The price on the button is now
 * always the real one.
 */
export function hintCharge(sparks: number): number {
  return Math.min(HINT_COST, Math.max(0, sparks))
}

export function strategyById(id: string): Strategy | undefined {
  return STRATEGIES.find((s) => s.id === id)
}

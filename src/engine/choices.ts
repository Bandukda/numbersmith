import { analyse, wrongAnswerFor } from './misconceptions'
import { DIAGNOSABLE } from './misconceptions'
import type { Order } from './types'

/**
 * Answer choices, built from misconceptions.
 *
 * There is no keypad. The child taps the answer from four orbs, and the
 * three wrong ones are not random noise: each is the number a specific,
 * documented reasoning bug would actually produce. Tap 25 for 34 - 19
 * and Flipsy pops out exactly as if it had been typed.
 *
 * That makes the distractors do real work. A child who is guessing gets
 * caught by the model; a child with a genuine misconception gets pulled
 * toward the option that names it.
 */

export const CHOICE_COUNT = 4

const shuffle = <T,>(xs: T[]): T[] => {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/** Small deterministic hash, so a given order always lays out the same. */
function seedFrom(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * Order-stable shuffle.
 *
 * The final layout is keyed off the order id rather than Math.random, so
 * remounting the answer row cannot reorder the orbs underneath a child
 * who is already reaching for one.
 */
function stableShuffle<T>(xs: T[], key: string): T[] {
  const a = [...xs]
  let seed = seedFrom(key) || 1
  const next = () => {
    seed ^= seed << 13; seed >>>= 0
    seed ^= seed >> 17
    seed ^= seed << 5; seed >>>= 0
    return seed / 0xffffffff
  }
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/** Plausible near-misses, for when the bug list runs dry. */
function fallbacks(answer: number): number[] {
  const near = [answer + 1, answer - 1, answer + 10, answer - 10, answer + 2, answer - 2]
  return near.filter((n) => n > 0)
}

/**
 * Four numbers to choose from: the answer, plus distractors drawn first
 * from real misconceptions and topped up with near-misses.
 */
export function answerChoices(order: Order): number[] {
  const { answer } = order.sentence
  const picked: number[] = [answer]

  // Misconception-derived distractors, verified to classify as intended.
  // Seeded, so the same order always produces the same four options.
  const fromBugs = stableShuffle(DIAGNOSABLE, order.id + ':bugs')
    .map((id) => ({ id, value: wrongAnswerFor(order, id) }))
    .filter((x): x is { id: string; value: number } =>
      x.value !== null && x.value > 0 && x.value !== answer)
    .filter((x) => analyse(order, x.value) === x.id)

  for (const { value } of fromBugs) {
    if (picked.length >= CHOICE_COUNT) break
    if (!picked.includes(value)) picked.push(value)
  }

  for (const n of stableShuffle(fallbacks(answer), order.id + ':near')) {
    if (picked.length >= CHOICE_COUNT) break
    if (!picked.includes(n)) picked.push(n)
  }

  // Last resort, so the row is never short.
  let pad = 1
  while (picked.length < CHOICE_COUNT) {
    const n = answer + pad
    if (!picked.includes(n) && n > 0) picked.push(n)
    pad++
  }

  // Deterministic final layout, keyed to this order.
  return stableShuffle(picked, order.id)
}

/** Numbers offered in Open Forge, where the child builds their own sum. */
export function openForgeTray(target: number): number[] {
  const tray = new Set<number>()
  for (let n = 1; n <= 12; n++) tray.add(n)
  for (const n of [target - 1, target + 1, target * 2, Math.floor(target / 2), target + 10, 15, 20, 24, 30]) {
    if (n > 0) tray.add(n)
  }
  // The target itself can never be an operand (checkWay rejects it), so
  // offering it would be handing the child a guaranteed dead end.
  tray.delete(target)
  return [...tray].sort((a, b) => a - b)
}

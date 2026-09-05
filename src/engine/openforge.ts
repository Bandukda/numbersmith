import { SKILLS } from './skills'
import { currentMastery, freshState } from './mastery'
import type { SkillState, Verb } from './types'

/**
 * Open Forge: "Make 24 any way you like."
 *
 * There is no single right answer. The child hunts for as many
 * different ways to build the target as they can, and the score is the
 * number of *distinct* ways found, not the speed of finding them.
 *
 * This is the purest statement of the game's thesis. The strategy
 * tokens argue that flexible thinking matters more than fast recall;
 * this mode makes flexibility the entire win condition.
 *
 * Operations unlock from the learner model rather than from a level
 * number, so earning multiplication elsewhere visibly widens what you
 * can do here. Mastery buys you options.
 */

export type Op = '+' | '-' | '×' | '÷'

export const ALL_OPS: Op[] = ['+', '-', '×', '÷']

const OP_VERB: Record<Op, Verb> = {
  '+': 'fuse', '-': 'cleave', '×': 'stamp', '÷': 'share',
}

export const OP_LABEL: Record<Op, string> = {
  '+': 'mash', '-': 'snap', '×': 'stamp', '÷': 'share',
}

/** Apply an operation, or null when it does not land on a whole number. */
export function applyOp(a: number, op: Op, b: number): number | null {
  switch (op) {
    case '+': return a + b
    case '-': return a - b
    case '×': return a * b
    case '÷': return b !== 0 && a % b === 0 ? a / b : null
  }
}

/**
 * Which operations this child may use.
 *
 * Addition is always available. Everything else opens once the child
 * has actually met a skill that uses it, so the toolbox grows with them.
 */
export function unlockedOps(states: Record<string, SkillState>): Op[] {
  const met = new Set<Verb>()
  for (const skill of SKILLS) {
    const st = states[skill.id]
    if (st && st.attempts > 0) met.add(skill.verb)
  }
  return ALL_OPS.filter((op) => op === '+' || met.has(OP_VERB[op]))
}

/**
 * Canonical identity of a way, so 4 + 20 and 20 + 4 count once.
 * Addition and multiplication commute; subtraction and division do not.
 */
export function wayKey(a: number, op: Op, b: number): string {
  if (op === '+' || op === '×') {
    const [lo, hi] = a <= b ? [a, b] : [b, a]
    return `${lo}${op}${hi}`
  }
  return `${a}${op}${b}`
}

export type Rejection = 'not-target' | 'uses-target' | 'zero' | 'negative' | 'duplicate'

export interface CheckResult {
  ok: boolean
  reason?: Rejection
  key?: string
  value?: number | null
}

/**
 * Validate an attempt against the target.
 *
 * Neither operand may BE the target: that blocks the degenerate
 * answers (24 + 0, 24 × 1, 24 ÷ 1) which restate the number rather
 * than decompose it, without banning legitimate small parts like
 * 1 + 23.
 */
export function checkWay(
  a: number, op: Op, b: number, target: number, found: string[],
): CheckResult {
  if (a === 0 || b === 0) return { ok: false, reason: 'zero' }
  if (a === target || b === target) return { ok: false, reason: 'uses-target' }

  const value = applyOp(a, op, b)
  if (value === null || value < 0) return { ok: false, reason: 'negative', value }
  if (value !== target) return { ok: false, reason: 'not-target', value }

  const key = wayKey(a, op, b)
  if (found.includes(key)) return { ok: false, reason: 'duplicate', key, value }
  return { ok: true, key, value }
}

/** Targets rich in decompositions, scaled to what the child can use. */
const TARGETS: Record<number, number[]> = {
  1: [6, 8, 10, 12, 14, 15, 16, 18, 20],
  2: [10, 12, 14, 15, 16, 18, 20, 24],
  3: [12, 16, 18, 20, 24, 30],
  4: [12, 16, 18, 20, 24, 30, 36, 48],
}

export function pickTarget(ops: Op[], avoid?: number): number {
  const pool = TARGETS[Math.min(ops.length, 4)] ?? TARGETS[1]!
  const choices = pool.filter((n) => n !== avoid)
  return choices[Math.floor(Math.random() * choices.length)]!
}

/**
 * How many ways a child would plausibly find.
 *
 * Subtraction and division have unbounded solution sets (1000 - 976
 * makes 24 too), so an exhaustive count is both enormous and useless
 * as a goal. These bounds keep the count to the ways that are actually
 * reachable with the numbers a K-5 child works in.
 */
export function countWays(target: number, ops: Op[]): number {
  const keys = new Set<string>()
  for (const op of ops) {
    if (op === '+') {
      for (let a = 1; a <= target / 2; a++) {
        const b = target - a
        if (b >= 1 && a !== target && b !== target) keys.add(wayKey(a, '+', b))
      }
    } else if (op === '×') {
      for (let a = 2; a * a <= target; a++) {
        if (target % a === 0) {
          const b = target / a
          if (a !== target && b !== target) keys.add(wayKey(a, '×', b))
        }
      }
    } else if (op === '-') {
      // Only take-aways that stay inside a sensible working range.
      for (let b = 1; b <= Math.min(target, 12); b++) {
        const a = target + b
        if (a !== target && b !== target) keys.add(wayKey(a, '-', b))
      }
    } else {
      for (let b = 2; b <= 10; b++) {
        const a = target * b
        if (a !== target && b !== target) keys.add(wayKey(a, '÷', b))
      }
    }
  }
  return keys.size
}

/**
 * How many ways to aim for. A concrete, reachable goal beats an
 * intimidating total, and is capped when a small target genuinely has
 * fewer ways available.
 */
export const WAYS_GOAL = 5
export function goalFor(target: number, ops: Op[]): number {
  return Math.max(2, Math.min(WAYS_GOAL, countWays(target, ops)))
}

export const OPEN_SPARKS = {
  /** First way found on a target. */
  first: 10,
  /** Every further distinct way. */
  another: 15,
  /** First time an operation is used on this target: flexibility pays most. */
  newOp: 30,
} as const

/** Skill-model helper for the ops hint on the dashboard. */
export function opsSummary(states: Record<string, SkillState>, day: number) {
  return ALL_OPS.map((op) => {
    const verb = OP_VERB[op]
    const skills = SKILLS.filter((s) => s.verb === verb)
    const best = Math.max(
      0,
      ...skills.map((s) => currentMastery(states[s.id] ?? freshState(), day)),
    )
    return { op, unlocked: unlockedOps(states).includes(op), best }
  })
}

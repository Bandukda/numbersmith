import { SKILLS, SKILL_BY_ID } from './skills'
import type { Skill, SkillState } from './types'

/**
 * Bayesian Knowledge Tracing with a forgetting curve.
 *
 * Standard four-parameter BKT (Corbett & Anderson 1995):
 *   pL0, prior probability the skill is already known
 *   pT, probability of learning it on any given opportunity
 *   pS, slip: knows it, answers wrong anyway
 *   pG, guess: doesn't know it, answers right anyway
 *
 * On top of that we apply exponential decay toward a retention floor,
 * so mastery genuinely fades without practice and the engine can
 * resurface stars for spaced review.
 */
export const BKT = {
  pL0: 0.14,
  pT: 0.20,
  pS: 0.09,
  /*
    Answers are chosen from four orbs rather than typed, so a pure guess
    lands about a quarter of the time. Leaving this at the free-entry
    value would have quietly overstated every child's mastery.
  */
  pG: 0.25,
  /** Daily decay constant. ~4% relative loss per day unpractised. */
  lambda: 0.042,
  /** Mastery never decays below this fraction of its peak. */
  retentionFloor: 0.42,
} as const

/** A star is "lit", counted as mastered, at this threshold. */
export const MASTERY_THRESHOLD = 0.92
/** Below this, a previously-lit star is flagged as fading. */
export const FADING_THRESHOLD = 0.80

export function freshState(): SkillState {
  return { pL: BKT.pL0, attempts: 0, correct: 0, lastSeenDay: 0, strategies: [], flags: [] }
}

/** Posterior P(mastery) after observing one graded attempt. */
/**
 * How much of the normal learning transition a repeat attempt on the SAME
 * question earns. Working through a repair really does teach something,
 * so it is not zero, but it is not evidence of mastery either.
 */
export const RETRY_LEARN = 0.45

/**
 * A second or third go at the question already on screen.
 *
 * BKT scores one observation per opportunity, and an opportunity is a
 * question, not a tap. Treating every submission as its own opportunity
 * let a child brute-force the four answer orbs and come out ahead of one
 * who simply knew it: measured from the same start, two wrong guesses
 * then a correct answer reached 0.612 while a clean first-try correct
 * reached only 0.498, because each extra attempt collected another
 * learning-transition bump.
 *
 * So the opportunity is scored once, on the first attempt. Later tries on
 * the same question move mastery only by the reduced transfer below, and
 * never through the "answered correctly" posterior.
 */
export function relearnBKT(pL: number): number {
  return clamp(pL + (1 - pL) * BKT.pT * RETRY_LEARN)
}

export function updateBKT(pL: number, correct: boolean): number {
  const { pS, pG, pT } = BKT
  const posterior = correct
    ? (pL * (1 - pS)) / (pL * (1 - pS) + (1 - pL) * pG)
    : (pL * pS) / (pL * pS + (1 - pL) * (1 - pG))
  // Learning transition: even a miss is an opportunity to learn.
  return clamp(posterior + (1 - posterior) * pT)
}

/**
 * Apply the forgetting curve for elapsed unpractised days.
 * Decays toward `retentionFloor * pL`, never to zero, you don't
 * forget everything, you just get rusty.
 */
export function decay(pL: number, days: number): number {
  if (days <= 0) return pL
  const floor = pL * BKT.retentionFloor
  return clamp(floor + (pL - floor) * Math.exp(-BKT.lambda * days))
}

/** P(the learner answers the next item on this skill correctly). */
export function predictedSuccess(pL: number): number {
  return pL * (1 - BKT.pS) + (1 - pL) * BKT.pG
}

/** Live mastery for a skill, accounting for time since last practice. */
export function currentMastery(st: SkillState, today: number): number {
  return decay(st.pL, today - st.lastSeenDay)
}

export type SkillStatus = 'locked' | 'ready' | 'learning' | 'fading' | 'mastered'

export function statusOf(
  skill: Skill,
  states: Record<string, SkillState>,
  today: number): SkillStatus {
  const st = states[skill.id] ?? freshState()
  const m = currentMastery(st, today)
  if (m >= MASTERY_THRESHOLD) return 'mastered'
  // "Fading" must mean decayed, not merely difficult: the undecayed score is
  // still strong, but time away has pulled the live value below threshold.
  // Without the pL check, a skill the learner is simply finding hard would be
  // mislabelled as needing review rather than needing teaching.
  if (st.correct >= 3 && st.pL >= FADING_THRESHOLD && m < FADING_THRESHOLD) return 'fading'
  if (st.attempts > 0) return 'learning'
  return prereqsMet(skill, states, today) ? 'ready' : 'locked'
}

export function prereqsMet(
  skill: Skill,
  states: Record<string, SkillState>,
  today: number): boolean {
  return skill.prereqs.every((p) => {
    const st = states[p]
    // A prerequisite counts as met once it is comfortably in reach,
    // not only at full mastery, otherwise progress stalls.
    return st ? currentMastery(st, today) >= 0.72 : false
  })
}

/** How close to the ideal-challenge sweet spot a skill currently sits. */
const TARGET_SUCCESS = 0.80

/**
 * Choose what to forge next.
 *
 * Priority order:
 *   1. A previously-mastered skill that has faded (spaced review wins).
 *   2. An unlocked skill whose predicted success is nearest 80%, *      the desirable-difficulty sweet spot.
 *   3. The earliest ready skill, for a brand-new smith.
 *
 * `avoid` keeps us from serving the same skill three times in a row.
 */
export function selectNextSkill(
  states: Record<string, SkillState>,
  today: number,
  avoid: string[] = [],
  gradeFilter?: string): Skill {
  const pool = SKILLS.filter((s) => !gradeFilter || s.grade === gradeFilter)
  const safePool = pool.length ? pool : SKILLS
  const eligible = safePool.filter((s) => prereqsMet(s, states, today))

  // A learner can jump straight to any grade band from the title screen, so
  // "nothing is eligible yet" is an ordinary state, not an error: fall back
  // first to entry-point skills, then to the easiest skills in the band.
  const entry = safePool.filter((s) => s.prereqs.length === 0)
  const open = eligible.length
    ? eligible
    : entry.length
      ? entry
      : [...safePool].sort((a, b) => a.tier - b.tier).slice(0, 4)

  const notRecent = open.filter((s) => !avoid.includes(s.id))
  const candidates = notRecent.length ? notRecent : open

  // 1. Spaced review: something known that has slipped.
  const faded = candidates
    .filter((s) => statusOf(s, states, today) === 'fading')
    .sort((a, b) => currentMastery(states[a.id]!, today) - currentMastery(states[b.id]!, today))
  if (faded.length) return faded[0]!

  // 2. Zone of proximal development: predicted success closest to 80%.
  const scored = candidates
    .filter((s) => {
      const st = states[s.id]
      return !st || currentMastery(st, today) < MASTERY_THRESHOLD
    })
    .map((s) => {
      const st = states[s.id] ?? freshState()
      const p = predictedSuccess(currentMastery(st, today))
      // Gentle tie-break toward lower tiers so the journey reads as a climb.
      return { s, cost: Math.abs(p - TARGET_SUCCESS) + s.tier * 0.004 }
    })
    .sort((a, b) => a.cost - b.cost)

  if (scored.length) return scored[0]!.s

  // 3. Everything in this band is mastered, revisit the weakest.
  const weakest = [...candidates].sort(
    (a, b) =>
      currentMastery(states[a.id] ?? freshState(), today) -
      currentMastery(states[b.id] ?? freshState(), today))[0]

  // This function must never return undefined: it drives the whole loop.
  return weakest ?? safePool[0] ?? SKILLS[0]!
}

/** Aggregate stats for the grown-up dashboard. */
export function summarise(states: Record<string, SkillState>, today: number) {
  let mastered = 0, learning = 0, fading = 0, attempts = 0, correct = 0
  const flags = new Map<string, number>()
  for (const skill of SKILLS) {
    const st = states[skill.id]
    if (!st) continue
    attempts += st.attempts
    correct += st.correct
    for (const f of st.flags) flags.set(f, (flags.get(f) ?? 0) + 1)
    const status = statusOf(skill, states, today)
    if (status === 'mastered') mastered++
    else if (status === 'fading') fading++
    else if (status === 'learning') learning++
  }
  return {
    mastered, learning, fading, attempts, correct,
    accuracy: attempts ? correct / attempts : 0,
    total: SKILLS.length,
    flags: [...flags.entries()].sort((a, b) => b[1] - a[1]),
  }
}

export function clamp(n: number, lo = 0.001, hi = 0.999): number {
  return Math.max(lo, Math.min(hi, n))
}

/** Depth of the prerequisite chain reachable from a skill, used by the map. */
export function unlockedBy(skillId: string): Skill[] {
  return SKILLS.filter((s) => s.prereqs.includes(skillId))
}

export { SKILL_BY_ID }

/** How many faded skills a warm-up will ask for at most. */
export const WARMUP_SIZE = 3

/**
 * Skills the child knew and is starting to forget.
 *
 * The forgetting curve is the least visible thing in this engine and the
 * most interesting: it already decides what gets offered, but until now a
 * child never saw it happen. These are the skills a warm-up should cover,
 * most faded first, so "you are starting to forget this" becomes a thing
 * the game says out loud rather than a hidden weighting.
 */
export function fadingSkills(
  states: Record<string, SkillState>,
  today: number,
  limit = WARMUP_SIZE): Skill[] {
  return SKILLS
    .filter((s) => statusOf(s, states, today) === 'fading')
    // Most decayed first: the furthest a skill has slipped from what the
    // child once knew is the most worth a minute of their time.
    .sort((a, b) => {
      const sa = states[a.id] ?? freshState()
      const sb = states[b.id] ?? freshState()
      return (sb.pL - currentMastery(sb, today)) - (sa.pL - currentMastery(sa, today))
    })
    .slice(0, limit)
}

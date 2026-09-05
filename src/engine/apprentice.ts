import { SKILLS, SKILL_BY_ID } from './skills'
import { currentMastery, freshState } from './mastery'
import { makeOrder } from './orders'
import { analyse, wrongAnswerFor } from './misconceptions'
import { MISCONCEPTIONS, DIAGNOSABLE, describeMiss } from './misconceptions'
import type { Order, Skill, SkillState } from './types'

/**
 * The Apprentice.
 *
 * Pip attempts a problem on a skill the child is already good at, and
 * gets it wrong in a *plausible* way drawn from the same misconception
 * taxonomy that diagnoses the child. The child has to spot it and say
 * what Pip did.
 *
 * Two reasons this is the strongest idea in the game:
 *
 * 1. The protege effect. Teaching a concept produces markedly stronger
 *    retention than practising it, and almost no maths software asks
 *    the learner to teach.
 * 2. It runs the whole engine backwards. Everywhere else the game
 *    diagnoses the child; here the child does the diagnosing, using
 *    exactly the bugs they have been collecting.
 *
 * Mastery is what unlocks it: you cannot teach what you do not know.
 */

/** You may only teach a skill you are reasonably solid on. */
export const TEACH_THRESHOLD = 0.55

/** Roughly this often, Pip is actually right, so "wrong" is never automatic. */
const PIP_CORRECT_RATE = 0.3

export interface Round {
  order: Order
  /** What Pip answered. */
  given: number
  pipIsRight: boolean
  /** The misconception behind Pip's answer, when wrong. */
  bugId?: string
  /** Three choices for "what did Pip do?", the real one among them. */
  options: string[]
}


/** Bugs that could plausibly arise on this order's operation. */
function candidatesFor(order: Order): string[] {
  return DIAGNOSABLE.filter((id) => {
    const wrong = wrongAnswerFor(order, id)
    if (wrong === null || wrong < 0 || wrong === order.sentence.answer) return false
    // The generated answer must genuinely classify as this bug, or the
    // child would be asked to spot something that is not there.
    return analyse(order, wrong) === id
  })
}

/** Skills the child knows well enough to teach. Fractions are excluded. */
export function teachableSkills(states: Record<string, SkillState>, day: number): Skill[] {
  return SKILLS.filter((s) => {
    if (s.verb === 'temper') return false
    const st = states[s.id]
    return !!st && st.attempts > 0 && currentMastery(st, day) >= TEACH_THRESHOLD
  })
}

const shuffle = <T,>(xs: T[]): T[] => {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/**
 * Build one teaching round on a skill.
 * Returns null when this skill cannot produce a well-formed round.
 */
export function buildRound(skillId: string, forceWrong = false): Round | null {
  for (let attempt = 0; attempt < 30; attempt++) {
    const order = makeOrder(skillId)
    const candidates = candidatesFor(order)
    if (!candidates.length) continue

    const pipIsRight = !forceWrong && Math.random() < PIP_CORRECT_RATE
    if (pipIsRight) {
      // Even when right, offer plausible options so the choice stays honest.
      // Simple skills have fewer than three candidate bugs, so pad from the
      // wider bestiary rather than showing a short list.
      const padded = [...candidates, ...shuffle(DIAGNOSABLE).filter((id) => !candidates.includes(id))]
      return {
        order, given: order.sentence.answer, pipIsRight: true,
        options: shuffle(padded.slice(0, 3)),
      }
    }

    const bugId = candidates[Math.floor(Math.random() * candidates.length)]!
    const given = wrongAnswerFor(order, bugId)!

    // Two distractors, preferring other bugs that fit this same operation.
    const others = shuffle(DIAGNOSABLE.filter((id) => id !== bugId))
    const sameOp = others.filter((id) => candidatesFor(order).includes(id))
    const pool = [...sameOp, ...others.filter((id) => !sameOp.includes(id))]
    const options = shuffle([bugId, ...pool.slice(0, 2)])

    return { order, given, pipIsRight: false, bugId, options }
  }
  return null
}

/** Pick a skill to teach, favouring the ones the child knows best. */
export function pickTeachSkill(
  states: Record<string, SkillState>, day: number, avoid?: string,
): Skill | null {
  const pool = teachableSkills(states, day)
  if (!pool.length) return null
  const ranked = [...pool].sort(
    (a, b) =>
      currentMastery(states[b.id] ?? freshState(), day) -
      currentMastery(states[a.id] ?? freshState(), day),
  )
  const top = ranked.slice(0, Math.max(3, Math.ceil(ranked.length / 2)))
  const choices = top.filter((s) => s.id !== avoid)
  const from = choices.length ? choices : top
  return from[Math.floor(Math.random() * from.length)]!
}

export function didWhat(bugId: string): string {
  return describeMiss(bugId) ?? 'made a mistake'
}

export const TEACH_SPARKS = {
  /** Spotting correctly whether Pip is right or wrong. */
  spotted: 20,
  /** Saying what Pip actually did. */
  diagnosed: 40,
} as const

export { SKILL_BY_ID }

import { SKILLS, SKILL_BY_ID, GRADES, GRADE_LABEL } from './skills'
import { statusOf, currentMastery, freshState, fadingSkills } from './mastery'
import { BUG_BY_ID } from './bugs'
import type { SkillState } from './types'
import type { BugState } from './bugs'

/*
  The snapshot handed to the language model for the grown-ups' summary.

  Deliberately not the raw store. Two reasons: the model does better on a
  small tidy structure than on a dump, and this is the only thing in the
  whole game that leaves the device, so it should be possible to read the
  entire payload in one screen and see exactly what is in it.

  What is NOT here matters as much as what is. No child's name, no
  answers they gave, no timestamps, no identifiers. The report says "your
  child" because the grown-up reading it already knows who that is, and a
  name is not needed to describe how someone is doing at subtraction.
*/
export interface ReportSnapshot {
  grades: { grade: string; label: string; mastered: number; total: number; averageMastery: number }[]
  strongest: string[]
  workingOn: string[]
  needsReview: string[]
  misconceptions: { what: string; skill: string; timesSeen: number; resolved: boolean }[]
  strategiesUsed: string[]
  totalProblems: number
  bestStreak: number
}

export function buildSnapshot(
  states: Record<string, SkillState>,
  bugs: Record<string, BugState>,
  day: number,
  totalForges: number,
  bestStreak: number,
  strategies: string[],
): ReportSnapshot {
  const mastery = (id: string) => currentMastery(states[id] ?? freshState(), day)

  const grades = GRADES.map((g) => {
    const list = SKILLS.filter((s) => s.grade === g)
    return {
      grade: g,
      label: GRADE_LABEL[g],
      mastered: list.filter((s) => statusOf(s, states, day) === 'mastered').length,
      total: list.length,
      averageMastery: Number((list.reduce((n, s) => n + mastery(s.id), 0) / list.length).toFixed(2)),
    }
  })

  const attempted = SKILLS.filter((s) => (states[s.id]?.attempts ?? 0) > 0)
  const byMastery = [...attempted].sort((a, b) => mastery(b.id) - mastery(a.id))

  return {
    grades,
    strongest: byMastery.filter((s) => mastery(s.id) >= 0.8).slice(0, 4).map((s) => s.label),
    workingOn: byMastery.filter((s) => mastery(s.id) < 0.6).slice(0, 4).map((s) => s.label),
    needsReview: fadingSkills(states, day, 4).map((s) => s.label),
    misconceptions: Object.entries(bugs).map(([id, b]) => ({
      // the grown-up facing description, not the creature's name
      what: BUG_BY_ID[id]?.didWhat ?? id,
      skill: SKILL_BY_ID[b.skillId]?.label ?? b.skillId,
      timesSeen: b.seen,
      resolved: b.caught,
    })),
    strategiesUsed: strategies,
    totalProblems: totalForges,
    bestStreak,
  }
}

/** Everything the model is told, in one place so it can be read at a glance. */
export function buildPrompt(s: ReportSnapshot): string {
  return [
    'You are writing a short progress note for the parent or teacher of a child',
    'aged 5 to 11 who has been using a maths practice game.',
    '',
    'Write 3 short paragraphs, no headings, no bullet points, no markdown.',
    'Speak plainly and warmly to the grown-up, calling the learner "your child".',
    'Paragraph 1: what is going well, naming specific skills.',
    'Paragraph 2: the one or two things to work on, and if a misconception is',
    'listed, explain in plain words what the child is actually doing wrong and',
    'why it is a normal thing to get stuck on.',
    'Paragraph 3: one concrete thing they could do together this week. Keep it',
    'to something doable at a kitchen table in five minutes.',
    '',
    'Never invent a skill, number or mistake that is not in the data.',
    'Do NOT make up worked examples or sums of your own, not even to',
    'illustrate. Describe the mistake in words instead. The whole point of',
    'this product is that a child is never shown arithmetic a model wrote,',
    'and a parent cannot tell an illustration from a real question anyway.',
    'If the data is thin, say so plainly rather than padding it out.',
    'Mastery runs 0 to 1, where 0.92 and above counts as mastered.',
    '',
    'DATA:',
    JSON.stringify(s, null, 2),
  ].join('\n')
}

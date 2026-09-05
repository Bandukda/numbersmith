/** Core domain types for the Numbersmith mastery engine. */

/** The five physical forge verbs. Each maps to an arithmetic operation. */
export type Verb = 'fuse' | 'cleave' | 'stamp' | 'share' | 'temper'

export type Grade = 'K' | '1' | '2' | '3' | '4' | '5'

/** One atomic, independently-traceable numeracy skill. */
export interface Skill {
  id: string
  /** Kid-facing name, spoken aloud. */
  label: string
  /** Grown-up / standards-facing description. */
  detail: string
  grade: Grade
  verb: Verb
  /** Skill ids that should be mastered before this is offered. */
  prereqs: string[]
  /** Position on the constellation map, normalised 0..1. */
  star: { x: number; y: number }
  /** Difficulty band used for ordering within a grade. */
  tier: number
}

/** Per-skill learner state tracked by the BKT engine. */
export interface SkillState {
  /** P(learner has mastered this skill), 0..1. */
  pL: number
  attempts: number
  correct: number
  /** Simulated-day timestamp of last practice, for the forgetting curve. */
  lastSeenDay: number
  /** Strategies the learner has demonstrated on this skill. */
  strategies: string[]
  /** Misconception ids ever detected on this skill. */
  flags: string[]
}

/** A forgeable order, one problem instance. */
export interface Order {
  id: string
  skillId: string
  verb: Verb
  /** Target value the learner must forge. */
  target: number
  /** Ore available on the tray (fuse) or the bar to work (cleave/stamp/...). */
  ore: number[]
  /** Optional source value for cleave / stamp / share / temper. */
  source?: number
  /** Constraint: exact number of pieces that must be used. */
  pieces?: number
  /**
   * Which kind of addition task this is.
   *  'bond' , the total is given, find two numbers that make it.
   *           The answer is the PAIR, so there is nothing to type.
   *  'sum'  , the two numbers are given, work out the total.
   *           The answer is genuinely unknown, so it is typed.
   */
  mode?: 'bond' | 'sum'
  /** For temper: denominator to slice into. */
  denom?: number
  /**
   * Which model a fraction is shown in. The same fraction is deliberately
   * met as a bar, a pizza and a point on a line, because a child who only
   * ever sees one model tends to learn the picture instead of the idea.
   */
  shape?: 'bar' | 'pizza' | 'line'
  /** Second fraction, for equivalence, unlike denominators and products. */
  frac2?: { n: number; d: number }
  /**
   * What the child is being asked to DO with the two fractions. Without
   * this the stage can only say "take n of d", which is the same sentence
   * for equivalence, addition and multiplication alike.
   */
  fracTask?: 'equiv' | 'add' | 'mult'
  /** For volume: the third dimension. Layers of a rows x cols array. */
  layers?: number
  /**
   * Decimal places to show. The engine keeps whole tenths or hundredths
   * and divides by 10^scale only for display, so no float ever enters
   * the arithmetic.
   */
  scale?: number
  /** For order of operations and powers, the expression to evaluate. */
  expr?: { text: string; steps: string[] }
  /** For share: number of crucibles. */
  groups?: number
  /** Kid-facing instruction, spoken aloud. */
  prompt: string
  /** The canonical arithmetic sentence, used for misconception analysis. */
  sentence: { a: number; b: number; op: '+' | '-' | '×' | '÷'; answer: number }
}

export interface Misconception {
  id: string
  /**
   * What the child actually did, in plain words. Used by the grown-ups'
   * report and by Teach Pip, where the choices are phrased as things a
   * person did rather than as error codes.
   */
  didWhat?: string
  /** What a grown-up sees on the dashboard. */
  label: string
  /** Warm, non-judgemental line spoken to the child. */
  kidLine: string
  /** Builds the guided repair scene for this specific order. */
  repair: (o: Order, given: number) => RepairBeat[]
}

export interface RepairBeat {
  text: string
  /** Visual mode the repair stage renders for this beat. */
  visual: 'rods' | 'array' | 'numberline' | 'bar' | 'orbs'
  /** Numbers the visual needs; meaning depends on `visual`. */
  data: number[]
  /** Highlight colour cue. */
  accent?: 'ember' | 'cyan' | 'violet' | 'mint'
}

export interface Strategy {
  id: string
  label: string
  /** Which sentence shapes this strategy plausibly applies to. */
  applies: (o: Order) => boolean
}

export interface AttemptResult {
  order: Order
  given: number
  correct: boolean
  misconception?: string
}

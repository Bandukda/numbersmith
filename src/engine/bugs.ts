import { MISCONCEPTIONS } from './misconceptions'

/**
 * Bugs: the child's own mistakes, made into creatures they collect.
 *
 * Every named misconception in the taxonomy has a creature. Make the
 * mistake and the creature pops out of the number and scuttles into
 * your jar as a "loose" bug. Get that same skill right three times in
 * a row and you catch it, and it turns friendly.
 *
 * This is the whole thesis of the game in one mechanic. Nothing here
 * is authored content: the bestiary is generated from the learner's
 * own error profile, so no two children collect the same set. It also
 * inverts maths anxiety completely, because a child who keeps making
 * the borrowing error now actively wants to meet it again.
 *
 * `generic.retry` deliberately has no creature. A miss with no
 * diagnosable shape is not a bug, and pretending otherwise would make
 * the collection meaningless.
 */

export type BugShape = 'blob' | 'tall' | 'wide' | 'spiky' | 'round'

export interface BugSpecies {
  /** Matches a misconception id exactly. */
  id: string
  name: string
  /** What it does, in the child's words. */
  blurb: string
  /** Short third-person phrase: "Pip ___". Used when teaching. */
  didWhat: string
  colour: string
  shape: BugShape
  eyes: 1 | 2 | 3
  legs: number
}

export const BUGS: BugSpecies[] = [
  { id: 'sub.smaller-from-larger', name: 'Flipsy',   blurb: 'Flipsy always takes the small number away from the big one.', didWhat: 'took the small number away from the big one', colour: 'tomato',   shape: 'blob',  eyes: 2, legs: 4 },
  { id: 'sub.swapped',            name: 'Mix-Up',  blurb: 'Mix-Up adds the numbers when it should subtract!', didWhat: 'added them instead of subtracting',          colour: 'plum',     shape: 'wide',  eyes: 2, legs: 6 },
  { id: 'sub.borrow-dropped',     name: 'Forgetty', blurb: 'Forgetty forgets the ten-stick already lent one away.', didWhat: 'forgot the ten-stick had lent one away',        colour: 'sky',      shape: 'tall',  eyes: 1, legs: 4 },
  { id: 'add.carry-dropped',      name: 'Spilly',   blurb: 'Spilly spills the extra ten instead of keeping it.', didWhat: 'forgot to turn ten ones into a ten-stick',           colour: 'marigold', shape: 'blob',  eyes: 2, legs: 4 },
  { id: 'add.swapped',            name: 'Splitsy',  blurb: 'Splitsy subtracts when the numbers want adding.', didWhat: 'subtracted instead of adding',     colour: 'teal',     shape: 'wide',  eyes: 3, legs: 4 },
  { id: 'add.count-slip',         name: 'Hoppo',    blurb: 'Hoppo hops one step too many, or one too few.', didWhat: 'hopped one step too many',                colour: 'leaf',     shape: 'round', eyes: 2, legs: 2 },
  { id: 'mult.added-instead',     name: 'Squishy',  blurb: 'Squishy adds two numbers instead of multiplying them.', didWhat: 'added them instead of multiplying',       colour: 'berry',    shape: 'blob',  eyes: 2, legs: 6 },
  { id: 'mult.skip-slip',         name: 'Skippy',   blurb: 'Skippy skips a whole row when you count.', didWhat: 'missed a whole row when counting',                     colour: 'plum',     shape: 'tall',  eyes: 2, legs: 6 },
  { id: 'mult.adjacent-fact',     name: 'Nearly',   blurb: 'Nearly brings an answer from the wrong times fact.', didWhat: 'used the answer from a different times fact',                colour: 'sky',      shape: 'round', eyes: 3, legs: 4 },
  { id: 'div.multiplied-instead', name: 'Growly',   blurb: 'Growly grows the number instead of dividing it.', didWhat: 'made it bigger instead of dividing',             colour: 'tomato',   shape: 'spiky', eyes: 2, legs: 4 },
  { id: 'div.reversed',           name: 'Topsy',    blurb: 'Topsy divides everything upside down.', didWhat: 'divided it the wrong way round',                         colour: 'teal',     shape: 'blob',  eyes: 1, legs: 4 },
  { id: 'div.remainder-dropped',  name: 'Leftie',   blurb: 'Leftie forgets the bits left over at the end.', didWhat: 'forgot the bits left over',                colour: 'marigold', shape: 'wide',  eyes: 2, legs: 2 },
  { id: 'frac.cuts-vs-parts',     name: 'Snipsy',   blurb: 'Snipsy counts the cuts instead of the pieces.', didWhat: 'counted the cuts instead of the pieces',                colour: 'leaf',     shape: 'spiky', eyes: 2, legs: 4 },
  { id: 'frac.bigger-denominator',name: 'Biggy',    blurb: 'Biggy thinks more pieces mean bigger pieces.', didWhat: 'thought more pieces meant bigger pieces',                colour: 'berry',    shape: 'round', eyes: 1, legs: 6 },
  { id: 'frac.add-across',        name: 'Bottomsy', blurb: 'Bottomsy adds the bottom numbers when it should not.', didWhat: 'added the bottom numbers too',         colour: 'plum',     shape: 'tall',  eyes: 3, legs: 4 },
]

export const BUG_BY_ID: Record<string, BugSpecies> =
  Object.fromEntries(BUGS.map((b) => [b.id, b]))

/** Correct answers in a row, on the bug's home skill, needed to catch it. */
export const CATCH_STREAK = 3

/** Per-learner state for one bug. */
export interface BugState {
  /** The skill it first appeared on. You catch it where you met it. */
  skillId: string
  /** How many times this mistake has been made. */
  seen: number
  /** Correct answers in a row on the home skill since it last bit. */
  streak: number
  caught: boolean
}

/** True when a misconception has a creature (i.e. is genuinely diagnostic). */
export function isCatchable(misconceptionId: string): boolean {
  return misconceptionId in BUG_BY_ID
}

export function speciesOf(id: string): BugSpecies | undefined {
  return BUG_BY_ID[id]
}

/** The grown-up name for the reasoning bug behind a creature. */
export function bugScienceName(id: string): string {
  return MISCONCEPTIONS[id]?.label ?? id
}

export interface BugSummary {
  caught: number
  loose: number
  undiscovered: number
  total: number
}

export function summariseBugs(bugs: Record<string, BugState>): BugSummary {
  let caught = 0, loose = 0
  for (const b of BUGS) {
    const st = bugs[b.id]
    if (!st) continue
    if (st.caught) caught++
    else loose++
  }
  return { caught, loose, undiscovered: BUGS.length - caught - loose, total: BUGS.length }
}

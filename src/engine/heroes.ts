/*
  The hero roster.

  Original characters in the superhero mould, not borrowed ones: the
  archetypes (the speedster, the tank, the armoured one) are common
  property, the names and likenesses are not, and this may end up on a
  store one day.

  Every hero embodies a number idea, so the collection reinforces the
  maths rather than sitting beside it. That distinction matters more than
  it sounds. The research on rewards is blunt about children: an expected
  prize for something they already find interesting reduces the wanting.
  What survives that is a reward the learning IS, rather than a token
  bolted next to it. So a hero is unlocked only by unaided work, arrives
  wearing the concept the child just proved, and cheers in its own voice.
*/

export type UnlockRule =
  | { kind: 'start' }
  | { kind: 'streak'; n: number }
  | { kind: 'medals'; n: number }
  | { kind: 'bugs'; n: number }

export interface Hero {
  id: string
  name: string
  /** What they are the hero of, in words a child can hold. */
  power: string
  unlock: UnlockRule
  /** Body, cape and trim, all from the game palette. */
  suit: string
  cape: string
  trim: string
  /**
   * How far below the standard the hero's face sits, in the drawing's own
   * units. Faces are not all at the same height: Big Ten's is small and
   * high on a tall stack, Glimmer's IS the whole body. Used to line the
   * face up with the speech cloud's tail.
   */
  headDrop: number
  /** Cheers in this hero's own voice. {n} is the child's name. */
  cheers: string[]
  named: string[]
}

export const HEROES: Hero[] = [
  {
    id: 'captain', name: 'Captain Number', power: 'All numbers, all the time',
    unlock: { kind: 'start' },
    headDrop: 0,
    suit: 'teal', cape: 'tomato', trim: 'marigold',
    cheers: ['Nice work!', 'You did it!', 'Brilliant!', 'That is the one!', 'Well done!'],
    named: ['Nice work, {n}!', 'You did it, {n}!', 'Brilliant, {n}!', 'Go {n}!', 'Well done, {n}!'],
  },
  {
    id: 'double', name: 'Double Trouble', power: 'Doubles everything, including herself',
    unlock: { kind: 'streak', n: 3 },
    headDrop: 4,
    suit: 'marigold', cape: 'berry', trim: 'cream',
    cheers: ['Twice as good!', 'Double win!', 'Two thumbs up!', 'Again! Again!', 'Right and right!'],
    named: ['Two cheers, {n}!', 'Double win, {n}!', '{n} times two!', 'Again, {n}! Again!', 'Twice as sharp, {n}!'],
  },
  {
    id: 'zip', name: 'Zip', power: 'Counts on faster than anyone',
    unlock: { kind: 'streak', n: 5 },
    headDrop: 3,
    suit: 'sky', cape: 'marigold', trim: 'cream',
    cheers: ['Too easy!', 'Next one!', 'Quick as that!', 'Blink and it is done!', 'Fast AND right!'],
    named: ['Too easy, {n}!', 'Keep up, {n}!', 'Quick as that, {n}!', 'Faster than me, {n}!', 'Go go go, {n}!'],
  },
  {
    id: 'slice', name: 'Slice', power: 'Cuts any whole into fair pieces',
    unlock: { kind: 'medals', n: 2 },
    headDrop: 0,
    suit: 'berry', cape: 'plum', trim: 'cream',
    cheers: ['Cut it clean!', 'Perfectly fair!', 'Every piece equal!', 'Sharp work!', 'Not a crumb wasted!'],
    named: ['Cut it clean, {n}!', 'Perfectly fair, {n}!', 'Sharp work, {n}!', 'Nice slicing, {n}!', 'Fair and square, {n}!'],
  },
  {
    id: 'bigten', name: 'Big Ten', power: 'Ten blocks tall, and knows what each one is worth',
    unlock: { kind: 'streak', n: 8 },
    headDrop: 6,
    suit: 'leaf', cape: 'teal', trim: 'cream',
    cheers: ['That... was... solid.', 'Built to last.', 'Strong answer.', 'Rock steady.', 'Nothing shaky there.'],
    named: ['Solid work, {n}.', 'Built to last, {n}.', 'Rock steady, {n}.', 'Strong one, {n}.', 'I felt that, {n}.'],
  },
  {
    id: 'countess', name: 'The Countess', power: 'Counts in twos, fives and tens without pausing',
    unlock: { kind: 'bugs', n: 1 },
    headDrop: 2,
    suit: 'plum', cape: 'marigold', trim: 'cream',
    cheers: ['Two, four, six... marvellous.', 'Beautifully counted.', 'Quite right.', 'Splendid!', 'Exactly so.'],
    named: ['Marvellous, {n}.', 'Quite right, {n}.', 'Splendid work, {n}.', 'Exactly so, {n}.', 'Well counted, {n}.'],
  },
  {
    id: 'carry', name: 'Carry', power: 'Hauls the spare ten to the next column',
    unlock: { kind: 'medals', n: 5 },
    headDrop: 3,
    suit: 'tomato', cape: 'leaf', trim: 'cream',
    cheers: ['I carried the ten. You did the hard part.', 'Heavy lifting done!', 'Nothing dropped!', 'All of it counted.', 'Not one left behind.'],
    named: ['You did the hard part, {n}!', 'Nothing dropped, {n}!', 'All counted, {n}!', 'Heavy lifting, {n}!', 'None left behind, {n}!'],
  },
  {
    id: 'echo', name: 'Echo', power: 'Repeats a pattern until it becomes a rhythm',
    unlock: { kind: 'streak', n: 12 },
    headDrop: 0,
    suit: 'cream', cape: 'sky', trim: 'plum',
    cheers: ['Again... again... you have the rhythm.', 'The pattern holds.', 'Same again. Good.', 'I hear it too.', 'It repeats. You saw it.'],
    named: ['You have the rhythm, {n}.', 'The pattern holds, {n}.', 'I hear it, {n}.', 'Same again, {n}.', 'You saw it, {n}.'],
  },
  {
    id: 'prime', name: 'Prime', power: 'Cannot be divided by anything',
    unlock: { kind: 'bugs', n: 3 },
    headDrop: 6,
    suit: 'ink-mid', cape: 'sky', trim: 'sky',
    cheers: ['Unbreakable. Like that answer.', 'Nothing splits that.', 'Solid all the way through.', 'Indivisible.', 'That one holds.'],
    named: ['Unbreakable, {n}.', 'Nothing splits that, {n}.', 'Indivisible, {n}.', 'That one holds, {n}.', 'Solid, {n}.'],
  },
  {
    id: 'glimmer', name: 'Glimmer', power: 'Small, bright, and impossible to ignore',
    unlock: { kind: 'medals', n: 10 },
    headDrop: -18,
    suit: 'marigold', cape: 'tomato', trim: 'cream',
    cheers: ['You did it you did it YOU DID IT!', 'Yesss!', 'That was SO good!', 'Wheeee!', 'Again again again!'],
    named: ['{n} DID IT!', 'Yesss, {n}!', 'SO good, {n}!', 'Wheee, {n}!', 'Go on then, {n}!'],
  },
]

export const HERO_BY_ID: Record<string, Hero> = Object.fromEntries(
  HEROES.map((h) => [h.id, h]),
)

export const STARTER_HERO = 'captain'

/** What a child has to show for a hero to join. */
export function isUnlocked(h: Hero, bestStreak: number, medals: number, bugsCaught: number): boolean {
  switch (h.unlock.kind) {
    case 'start':  return true
    case 'streak': return bestStreak >= h.unlock.n
    case 'medals': return medals >= h.unlock.n
    case 'bugs':   return bugsCaught >= h.unlock.n
  }
}

export function unlockedHeroes(bestStreak: number, medals: number, bugsCaught: number): Hero[] {
  return HEROES.filter((h) => isUnlocked(h, bestStreak, medals, bugsCaught))
}

/** Said in a child's own words, so a locked hero is still a goal not a wall. */
export function unlockHint(h: Hero): string {
  switch (h.unlock.kind) {
    case 'start':  return 'Here from the start'
    case 'streak': return `Get ${h.unlock.n} right in a row`
    case 'medals': return `Win ${h.unlock.n} medal${h.unlock.n === 1 ? '' : 's'}`
    case 'bugs':   return `Catch ${h.unlock.n} bug${h.unlock.n === 1 ? '' : 's'}`
  }
}

/**
 * A cheer in this hero's voice.
 *
 * Only every other one uses the name: hearing it after every single
 * answer wears out fast, and the plain cheers in between are what keep
 * the named ones feeling like they were meant.
 */
export function cheerFrom(h: Hero, n: number, name = ''): string {
  const safe = Number.isFinite(n) ? Math.abs(Math.trunc(n)) : 0
  const i = safe % h.cheers.length
  const pass = Math.floor(safe / h.cheers.length)
  const clean = (name ?? '').trim()
  const plain = h.cheers[i] ?? h.cheers[0]!
  if (!clean || (safe + pass) % 2 === 1) return plain
  return (h.named[i] ?? h.named[0]!).replace('{n}', clean)
}

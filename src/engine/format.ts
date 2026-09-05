/**
 * Decimals are stored as whole numbers of tenths or hundredths and only
 * become decimals on the way to the screen.
 *
 * Keeping the engine in integers means 0.1 + 0.2 is 3 tenths rather than
 * 0.30000000000000004, so misconception analysis, answer distractors and
 * equality checks all keep working unchanged.
 */
export function fmt(v: number, scale = 0): string {
  if (!scale) return String(v)
  return (v / 10 ** scale).toFixed(scale)
}

/**
 * "a" or "an", chosen by how the number is SPOKEN rather than spelled.
 *
 * The prompt is read aloud by a child or a parent, and "Make a 8" trips
 * anyone who reads it out. Eight, eleven and eighteen are the only number
 * words in this game's range that begin with a vowel sound.
 */
export function article(n: number): 'a' | 'an' {
  const digits = String(Math.abs(Math.trunc(n)))
  // 8, 80, 800 all begin "eight-"
  if (digits.startsWith('8')) return 'an'
  if (n === 11 || n === 18) return 'an'
  return 'a'
}

/** "1 row", "3 rows". Counts that can reach one need the singular. */
export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`
}

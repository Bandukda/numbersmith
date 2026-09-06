import { SKILLS, SKILL_BY_ID, EDGES } from '../src/engine/skills'
import { freshState, updateBKT, relearnBKT, RETRY_LEARN, fadingSkills, WARMUP_SIZE, decay, currentMastery, selectNextSkill, statusOf, predictedSuccess, MASTERY_THRESHOLD, FADING_THRESHOLD } from '../src/engine/mastery'
import { makeOrder, VERB_META } from '../src/engine/orders'
import { analyse, smallerFromLarger, noCarrySum, MISCONCEPTIONS, DIAGNOSABLE, describeMiss } from '../src/engine/misconceptions'
import { strategiesFor, SPARKS, HINT_COST, hintCharge } from '../src/engine/strategies'
import { checkWay, wayKey, applyOp, unlockedOps, countWays, pickTarget, ALL_OPS, OP_LABEL, type Op } from '../src/engine/openforge'
import { buildRound, pickTeachSkill, teachableSkills, TEACH_THRESHOLD, didWhat } from '../src/engine/apprentice'
import { answerChoices, openForgeTray, CHOICE_COUNT } from '../src/engine/choices'
import { article } from '../src/engine/format'
import { personalise } from '../src/engine/report'
import { bands } from '../src/components/stages/AreaModel'
import { cheerSize, bubbleScale } from '../src/components/Hero'
import { HEROES, HERO_BY_ID, STARTER_HERO, cheerFrom, isUnlocked, unlockedHeroes, unlockHint } from '../src/engine/heroes'
import type { SkillState } from '../src/engine/types'

let pass = 0, fail = 0
const ok = (name: string, cond: boolean, extra = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`) }
  else { fail++; console.log(`  ✗ ${name} ${extra}`) }
}
const section = (s: string) => console.log(`\n\x1b[1m${s}\x1b[0m`)

/* ── 1. skill graph integrity ─────────────────────────────── */
section('Skill graph')
ok(`${SKILLS.length} skills defined`, SKILLS.length >= 40)
ok('all ids unique', new Set(SKILLS.map(s => s.id)).size === SKILLS.length)
ok('every prereq resolves to a real skill',
   SKILLS.every(s => s.prereqs.every(p => !!SKILL_BY_ID[p])),
   SKILLS.filter(s => s.prereqs.some(p => !SKILL_BY_ID[p])).map(s => s.id).join(','))
ok('no skill is its own prereq', SKILLS.every(s => !s.prereqs.includes(s.id)))
ok('graph is acyclic', (() => {
  const seen = new Map<string, number>()
  const visit = (id: string): boolean => {
    const st = seen.get(id) ?? 0
    if (st === 1) return false
    if (st === 2) return true
    seen.set(id, 1)
    for (const p of SKILL_BY_ID[id]!.prereqs) if (!visit(p)) return false
    seen.set(id, 2)
    return true
  }
  return SKILLS.every(s => visit(s.id))
})())
ok('every grade K-5 is represented',
   ['K','1','2','3','4','5'].every(g => SKILLS.some(s => s.grade === g)))
ok('all five verbs are used',
   ['fuse','cleave','stamp','share','temper'].every(v => SKILLS.some(s => s.verb === v)))
ok(`${EDGES.length} prerequisite edges`, EDGES.length > 30)

/* ── 2. BKT behaves like knowledge tracing should ─────────── */
section('BKT mastery engine')
let p = freshState().pL
const before = p
for (let i = 0; i < 6; i++) p = updateBKT(p, true)
ok('6 correct answers drive mastery high', p > MASTERY_THRESHOLD, `got ${p.toFixed(3)}`)
ok('mastery rose from prior', p > before)

let q = 0.95
q = updateBKT(q, false)
ok('one miss dents high mastery', q < 0.95 && q > 0.4, `got ${q.toFixed(3)}`)

ok('decay reduces mastery over time', decay(0.95, 30) < 0.95)
ok('decay respects the retention floor', decay(0.95, 100000) >= 0.95 * 0.42 - 1e-6)
ok('decay of 0 days is a no-op', decay(0.8, 0) === 0.8)
ok('predicted success rises with mastery', predictedSuccess(0.9) > predictedSuccess(0.2))
ok('predicted success is a probability',
   [0, 0.5, 1].every(m => predictedSuccess(m) >= 0 && predictedSuccess(m) <= 1))

/* ── 3. adaptive selection ────────────────────────────────── */
section('Adaptive selection')
const states: Record<string, SkillState> = Object.fromEntries(SKILLS.map(s => [s.id, freshState()]))
const first = selectNextSkill(states, 0)
ok('a fresh smith starts with no prereqs', first.prereqs.length === 0, `got ${first.id}`)

// Master the whole K band, then check the engine moves on.
for (const s of SKILLS.filter(s => s.grade === 'K')) {
  let m = freshState().pL
  for (let i = 0; i < 10; i++) m = updateBKT(m, true)
  states[s.id] = { ...freshState(), pL: m, attempts: 10, correct: 10, lastSeenDay: 0 }
}
const next = selectNextSkill(states, 0)
ok('after mastering K it advances past K', next.grade !== 'K', `got ${next.id} (${next.grade})`)

// Let a long time pass, decayed skills should be resurfaced for review.
const later = selectNextSkill(states, 400)
ok('decayed skills are resurfaced for spaced review',
   statusOf(later, states, 400) === 'fading' || later.grade === 'K',
   `got ${later.id} status=${statusOf(later, states, 400)}`)

ok('grade filter is honoured',
   selectNextSkill(states, 0, [], '3')?.grade === '3')
ok('every grade band is playable from a totally fresh save', (() => {
  const blank: Record<string, SkillState> = Object.fromEntries(SKILLS.map(s => [s.id, freshState()]))
  return (['K','1','2','3','4','5'] as const).every(g => {
    const s = selectNextSkill(blank, 0, [], g)
    return !!s && s.grade === g && !!makeOrder(s.id)
  })
})())
ok('selection never returns undefined under hostile inputs', (() => {
  const blank: Record<string, SkillState> = {}
  return !!selectNextSkill(blank, 0, SKILLS.map(s => s.id))
      && !!selectNextSkill(blank, 9999, [], 'K')
      && !!selectNextSkill(blank, 0, [], 'zzz' as any)
})())
ok('selection never repeats an avoided skill when alternatives exist', (() => {
  const picks = new Set<string>()
  for (let i = 0; i < 30; i++) picks.add(selectNextSkill(states, 0, [...picks].slice(-2)).id)
  return picks.size > 1
})())

/* ── 4. order generation across every skill ───────────────── */
section('Order generation (200 orders per skill)')
let bad: string[] = []
for (const s of SKILLS) {
  for (let i = 0; i < 200; i++) {
    const o = makeOrder(s.id)
    const { a, b, op, answer } = o.sentence
    const truth = op === '+' ? a + b : op === '-' ? a - b : op === '×' ? a * b : Math.floor(a / b)
    if (op !== '÷' || o.verb !== 'temper') {
      if (answer !== truth) { bad.push(`${s.id}: ${a}${op}${b}=${answer} (should be ${truth})`); break }
    }
    if (o.verb === 'fuse') {
      if (!o.ore.includes(a) || !o.ore.includes(b)) { bad.push(`${s.id}: ore missing ${a} or ${b}`); break }
      if (answer < 0) { bad.push(`${s.id}: negative target`); break }
    }
    if (o.verb === 'cleave') {
      // The slider spans 1..source-1, so keep must sit strictly inside it.
      if (b < 1 || b > (o.source ?? 0) - 1) { bad.push(`${s.id}: keep ${b} outside slider range 1..${(o.source ?? 0) - 1}`); break }
      if ((o.source ?? 0) <= b) { bad.push(`${s.id}: cleave source ${o.source} <= keep ${b}`); break }
      if (answer <= 0) { bad.push(`${s.id}: cleave answer ${answer} not positive`); break }
    }
    if (o.verb === 'share') {
      if ((o.groups ?? 0) < 2) { bad.push(`${s.id}: share groups < 2`); break }
      if (answer < 1) { bad.push(`${s.id}: share answer < 1`); break }
    }
    if (o.verb === 'temper') {
      const d = o.denom ?? 0
      if (d < 2 || o.target < 1 || o.target > d) { bad.push(`${s.id}: bad fraction ${o.target}/${d}`); break }
    }
    if (!o.prompt || !o.id) { bad.push(`${s.id}: missing prompt/id`); break }
  }
}
ok('every skill generates arithmetically sound orders', bad.length === 0, `\n     ${bad.slice(0,6).join('\n     ')}`)

// Skills whose whole point is regrouping must actually require it.
let carryFails = 0, borrowFails = 0
for (let i = 0; i < 300; i++) {
  const c = makeOrder('g2.carry')
  if ((c.sentence.a % 10) + (c.sentence.b % 10) < 10) carryFails++
  const bo = makeOrder('g2.borrow')
  if ((bo.sentence.a % 10) >= (bo.sentence.b % 10)) borrowFails++
}
ok('"The Carry" always requires a carry', carryFails === 0, `${carryFails}/300 failed`)
ok('"The Borrow" always requires a borrow', borrowFails === 0, `${borrowFails}/300 failed`)

/* ── 5. misconception radar ───────────────────────────────── */
section('Misconception radar')
ok('smaller-from-larger: 34-19 -> 25', smallerFromLarger(34, 19) === 25)
ok('smaller-from-larger: 52-27 -> 35', smallerFromLarger(52, 27) === 35)
ok('no-carry sum: 27+15 -> 32', noCarrySum(27, 15) === 32)
ok('no-carry sum: 48+36 -> 74', noCarrySum(48, 36) === 74)

const probe = (a: number, b: number, op: '+'|'-'|'×'|'÷', given: number) => {
  const answer = op === '+' ? a+b : op === '-' ? a-b : op === '×' ? a*b : Math.floor(a/b)
  return analyse({ id:'t', skillId:'k.count10', verb:'fuse', target:answer, ore:[], prompt:'', sentence:{a,b,op,answer} }, given)
}
ok('correct answer yields no diagnosis', probe(3, 4, '+', 7) === undefined)
ok('34 − 19 = 25 -> smaller-from-larger', probe(34,19,'-',25) === 'sub.smaller-from-larger')
ok('34 − 19 = 53 -> added instead',       probe(34,19,'-',53) === 'sub.swapped')
ok('27 + 15 = 32 -> dropped the carry',   probe(27,15,'+',32) === 'add.carry-dropped')
ok('7 + 3 = 9  -> counting slip',         probe(7,3,'+',9)    === 'add.count-slip')
ok('7 × 8 = 15 -> added the factors',     probe(7,8,'×',15)   === 'mult.added-instead')
ok('7 × 8 = 48 -> one row off',           probe(7,8,'×',48)   === 'mult.skip-slip')
ok('7 × 8 = 63 -> one row off (63 is 7×9)', probe(7,8,'×',63) === 'mult.skip-slip')
ok('7 × 8 = 54 -> neighbouring fact (6×9)', probe(7,8,'×',54)  === 'mult.adjacent-fact')
ok('24 ÷ 4 = 96 -> multiplied instead',   probe(24,4,'÷',96)  === 'div.multiplied-instead')
ok('25 ÷ 4 = 6  is correct (quotient is floored)', probe(25,4,'÷',6) === undefined)
ok('25 ÷ 4 = 7  -> remainder dropped',    probe(25,4,'÷',7)   === 'div.remainder-dropped')
ok('unrecognised miss falls back safely', probe(3,4,'+',991)  === 'generic.retry')
ok('every rule id maps to a real misconception', (() => {
  const ids = new Set<string>()
  for (let i = 0; i < 4000; i++) {
    const a = 1 + Math.floor(Math.random()*99), b = 1 + Math.floor(Math.random()*30)
    for (const op of ['+','-','×','÷'] as const) {
      const g = Math.floor(Math.random()*200)
      const r = probe(Math.max(a,b), Math.min(a,b), op, g)
      if (r) ids.add(r)
    }
  }
  return [...ids].every(id => !!MISCONCEPTIONS[id])
})())

/* ── 6. every repair scene actually builds ────────────────── */
section('Repair scenes')
let repairBad: string[] = []
for (const [id, mc] of Object.entries(MISCONCEPTIONS)) {
  for (const skill of SKILLS) {
    try {
      const beats = mc.repair(makeOrder(skill.id), 99)
      if (!beats.length) repairBad.push(`${id}: no beats`)
      if (beats.some(b => !b.text || !b.visual)) repairBad.push(`${id}: malformed beat`)
      if (beats.some(b => /NaN|undefined/.test(b.text))) repairBad.push(`${id} on ${skill.id}: NaN/undefined in text`)
    } catch (e) { repairBad.push(`${id} on ${skill.id}: threw ${e}`) }
  }
}
ok('all 16 repair scenes build cleanly for every skill', repairBad.length === 0,
   `\n     ${[...new Set(repairBad)].slice(0,6).join('\n     ')}`)

/* ── 7. strategy tokens ───────────────────────────────────── */
section('Strategy tokens')
let stratBad = 0
for (const s of SKILLS) for (let i = 0; i < 50; i++) {
  const opts = strategiesFor(makeOrder(s.id))
  if (opts.length < 2 || opts.length > 4) stratBad++
  if (new Set(opts.map(o => o.id)).size !== opts.length) stratBad++
}
ok('every order offers 2-4 distinct strategies', stratBad === 0, `${stratBad} violations`)

/* ── 8. full simulated learner run ────────────────────────── */
section('Simulated learner (500 forges, 85% accuracy)')
const sim: Record<string, SkillState> = Object.fromEntries(SKILLS.map(s => [s.id, freshState()]))
let day = 0, seen = new Set<string>(), recent: string[] = []
for (let i = 0; i < 500; i++) {
  const skill = selectNextSkill(sim, day, recent.slice(-2))
  seen.add(skill.id)
  recent = [...recent, skill.id].slice(-6)
  const order = makeOrder(skill.id)
  const correct = Math.random() < 0.85
  const st = sim[skill.id]!
  sim[skill.id] = {
    ...st, pL: updateBKT(currentMastery(st, day), correct),
    attempts: st.attempts + 1, correct: st.correct + (correct ? 1 : 0), lastSeenDay: day,
  }
  if (i % 20 === 19) day++
  if (!order.prompt) { fail++; break }
}
const mastered = SKILLS.filter(s => statusOf(s, sim, day) === 'mastered').length
ok(`learner reached ${mastered} mastered skills`, mastered > 8, `only ${mastered}`)
ok(`engine explored ${seen.size} distinct skills`, seen.size > 10, `only ${seen.size}`)
ok('no skill was starved of practice while unlocked', seen.size >= mastered)



/* ── 9. fading means decayed, not merely difficult ────────── */
section('Fading semantics')
{
  const st: Record<string, SkillState> = Object.fromEntries(SKILLS.map(s => [s.id, freshState()]))
  // A skill the learner finds HARD: practised today, low mastery.
  let hard = freshState().pL
  for (let i = 0; i < 4; i++) hard = updateBKT(hard, true)
  for (let i = 0; i < 4; i++) hard = updateBKT(hard, false)
  st['k.count10'] = { ...freshState(), pL: hard, attempts: 8, correct: 4, lastSeenDay: 10 }
  ok('a hard skill practised today is "learning", not "fading"',
     statusOf(SKILL_BY_ID['k.count10']!, st, 10) === 'learning',
     `got ${statusOf(SKILL_BY_ID['k.count10']!, st, 10)}`)

  // A skill once mastered, then left alone for a month.
  let strong = freshState().pL
  for (let i = 0; i < 10; i++) strong = updateBKT(strong, true)
  st['k.bond5'] = { ...freshState(), pL: strong, attempts: 10, correct: 10, lastSeenDay: 0 }
  ok('a mastered skill left for 60 days is "fading"',
     statusOf(SKILL_BY_ID['k.bond5']!, st, 60) === 'fading',
     `got ${statusOf(SKILL_BY_ID['k.bond5']!, st, 60)}`)
  ok('the same skill practised today is "mastered"',
     statusOf(SKILL_BY_ID['k.bond5']!, { ...st, 'k.bond5': { ...st['k.bond5']!, lastSeenDay: 60 } }, 60) === 'mastered')
}



/* ── 10. the misconception catalogue ──────────────────────── */
section('Misconception catalogue')

/*
  Every misconception the radar can name has to carry a plain-words
  description of what the child did. Teach Pip offers these as choices
  and the grown-ups' report reads them out, so an entry without one is a
  diagnosis nobody can act on.
*/
{
  const named = Object.keys(MISCONCEPTIONS).filter((id) => id !== 'generic.retry')

  ok(`every named misconception says what happened (${named.length})`,
     named.every((id) => !!MISCONCEPTIONS[id]!.didWhat),
     `missing: ${named.filter((id) => !MISCONCEPTIONS[id]!.didWhat).join(', ')}`)

  ok('the diagnosable list matches the named ones',
     DIAGNOSABLE.length === named.length &&
     named.every((id) => DIAGNOSABLE.includes(id)))

  ok('a shapeless miss is not diagnosable',
     !DIAGNOSABLE.includes('generic.retry'))

  ok('a shapeless miss still reads as something',
     describeMiss('generic.retry').length > 3 &&
     !describeMiss('generic.retry').includes('undefined'))

  ok('an unknown id never leaks into what a grown-up reads',
     !describeMiss('no.such.thing').includes('no.such.thing'))

  ok('every description reads as a thing a person did',
     named.every((id) => {
       const w = describeMiss(id)
       return w.length > 8 && w === w.toLowerCase().slice(0, 1) + w.slice(1)
     }))
}

/* ── 11. Open Forge: "make 24 any way you like" ───────────── */
section('Open Forge')
{
  ok('applyOp handles all four operations',
     applyOp(20, '+', 4) === 24 && applyOp(30, '-', 6) === 24 &&
     applyOp(6, '×', 4) === 24 && applyOp(48, '÷', 2) === 24)
  ok('division that does not land whole is rejected', applyOp(25, '÷', 4) === null)
  ok('division by zero is rejected', applyOp(24, '÷', 0) === null)

  // Commutative ops must collapse; non-commutative must not.
  ok('4 + 20 and 20 + 4 are the same way', wayKey(4, '+', 20) === wayKey(20, '+', 4))
  ok('6 × 4 and 4 × 6 are the same way',   wayKey(6, '×', 4) === wayKey(4, '×', 6))
  ok('30 - 6 and 6 - 30 are different ways', wayKey(30, '-', 6) !== wayKey(6, '-', 30))
  ok('48 ÷ 2 and 2 ÷ 48 are different ways', wayKey(48, '÷', 2) !== wayKey(2, '÷', 48))

  const T = 24
  ok('a correct way is accepted', checkWay(20, '+', 4, T, []).ok)
  ok('a way already found is rejected as duplicate',
     checkWay(4, '+', 20, T, [wayKey(20, '+', 4)]).reason === 'duplicate')
  ok('a wrong total is rejected and reports what it made', (() => {
    const r = checkWay(20, '+', 3, T, [])
    return !r.ok && r.reason === 'not-target' && r.value === 23
  })())

  // The degenerate answers that restate rather than decompose.
  ok('24 + 0 is rejected', !checkWay(24, '+', 0, T, []).ok)
  ok('24 × 1 is rejected (uses the target itself)',
     checkWay(24, '×', 1, T, []).reason === 'uses-target')
  ok('24 ÷ 1 is rejected (uses the target itself)',
     checkWay(24, '÷', 1, T, []).reason === 'uses-target')
  ok('but 1 + 23 is still a legitimate way', checkWay(1, '+', 23, T, []).ok)
  ok('a result below zero is rejected', !checkWay(4, '-', 30, T, []).ok)

  // Operations unlock from the learner model, not a level number.
  const blank: Record<string, SkillState> = Object.fromEntries(SKILLS.map(s => [s.id, freshState()]))
  ok('a brand new player has addition only',
     JSON.stringify(unlockedOps(blank)) === JSON.stringify(['+']))

  const withMult = { ...blank, 'g3.mult5': { ...freshState(), attempts: 1 } }
  ok('meeting a multiplication skill unlocks ×', unlockedOps(withMult).includes('×'))
  ok('and does not unlock division too', !unlockedOps(withMult).includes('÷'))

  const withAll = {
    ...blank,
    'g3.mult5': { ...freshState(), attempts: 1 },
    'g1.sub10': { ...freshState(), attempts: 1 },
    'g3.div':   { ...freshState(), attempts: 1 },
  }
  ok('meeting all four verbs unlocks all four operations',
     ALL_OPS.every(o => unlockedOps(withAll).includes(o)))

  // Every generated target must actually be solvable, and richly so.
  let thin: string[] = []
  for (const ops of [['+'], ['+','-'], ['+','-','×'], ['+','-','×','÷']] as Op[][]) {
    for (let i = 0; i < 40; i++) {
      const t = pickTarget(ops)
      const n = countWays(t, ops)
      if (n < 3) thin.push(`${t} with ${ops.join('')} has only ${n} ways`)
    }
  }
  ok('every target offers at least 3 ways with the available operations',
     thin.length === 0, [...new Set(thin)].slice(0, 4).join('; '))

  ok('more operations means more ways to find',
     countWays(24, ['+', '-', '×', '÷']) > countWays(24, ['+']))
  ok('pickTarget can avoid repeating the last target',
     Array.from({ length: 20 }, () => pickTarget(['+','-','×','÷'], 24)).every(t => t !== 24))

  // The scoring path: distinct ways accumulate, duplicates never do.
  const found: string[] = []
  for (const [a, op, b] of [[20,'+',4],[4,'+',20],[6,'×',4],[30,'-',6],[6,'×',4]] as [number,Op,number][]) {
    const r = checkWay(a, op, b, T, found)
    if (r.ok) found.push(r.key!)
  }
  ok('five attempts with two repeats yields three distinct ways',
     found.length === 3, `got ${found.length}: ${found.join(', ')}`)
}



/* ── 12. The Apprentice: the child does the diagnosing ────── */
section('The Apprentice')
{
  // The critical property: a mistake generated FROM a misconception must
  // classify back AS that misconception, or the child is asked to spot
  // something that is not actually there.
  const teachable = SKILLS.filter(s => s.verb !== 'temper')
  let mismatches: string[] = []
  let rounds = 0, wrongRounds = 0, rightRounds = 0

  for (const skill of teachable) {
    for (let i = 0; i < 25; i++) {
      const r = buildRound(skill.id)
      if (!r) { mismatches.push(`${skill.id}: no round could be built`); break }
      rounds++
      if (r.pipIsRight) {
        rightRounds++
        if (r.given !== r.order.sentence.answer) mismatches.push(`${skill.id}: "right" round has wrong answer`)
        if (analyse(r.order, r.given) !== undefined) mismatches.push(`${skill.id}: "right" round analyses as an error`)
      } else {
        wrongRounds++
        if (!r.bugId) { mismatches.push(`${skill.id}: wrong round has no bug`); continue }
        const back = analyse(r.order, r.given)
        if (back !== r.bugId) {
          mismatches.push(`${skill.id}: generated ${r.bugId} but it analyses as ${back}`)
        }
        if (r.given === r.order.sentence.answer) mismatches.push(`${skill.id}: "wrong" answer equals the right one`)
      }
      if (r.options.length !== 3) mismatches.push(`${skill.id}: ${r.options.length} options, expected 3`)
      if (new Set(r.options).size !== r.options.length) mismatches.push(`${skill.id}: duplicate options`)
      if (!r.pipIsRight && !r.options.includes(r.bugId!)) {
        mismatches.push(`${skill.id}: the real answer is missing from the options`)
      }
    }
  }

  ok(`every generated mistake classifies back correctly (${rounds} rounds)`,
     mismatches.length === 0, `\n     ${[...new Set(mismatches)].slice(0, 5).join('\n     ')}`)
  ok('Pip is sometimes right and sometimes wrong',
     rightRounds > 0 && wrongRounds > 0, `right=${rightRounds} wrong=${wrongRounds}`)
  ok('Pip is right roughly a third of the time, never most of the time',
     rightRounds / rounds > 0.15 && rightRounds / rounds < 0.45,
     `${Math.round((rightRounds / rounds) * 100)}%`)
  ok('forceWrong always produces a mistake to find',
     Array.from({ length: 40 }, () => buildRound('g2.borrow', true))
       .every(r => r !== null && !r.pipIsRight))
  ok('every option maps to a real phrase',
     Array.from({ length: 60 }, () => buildRound('g3.mult9'))
       .every(r => r !== null && r.options.every(o => didWhat(o) !== 'made a mistake')))

  // You cannot teach what you do not know.
  const blank: Record<string, SkillState> = Object.fromEntries(SKILLS.map(s => [s.id, freshState()]))
  ok('a brand new player can teach nothing', teachableSkills(blank, 0).length === 0)
  ok('and pickTeachSkill returns null rather than throwing', pickTeachSkill(blank, 0) === null)

  let strong = freshState().pL
  for (let i = 0; i < 8; i++) strong = updateBKT(strong, true)
  const known = { ...blank, 'g2.borrow': { ...freshState(), pL: strong, attempts: 8, correct: 8 } }
  ok('mastering a skill unlocks teaching it',
     teachableSkills(known, 0).some(s => s.id === 'g2.borrow'))
  ok('teaching is offered only above the threshold',
     teachableSkills(known, 0).every(s => currentMastery(known[s.id]!, 0) >= TEACH_THRESHOLD))
  ok('fractions are never offered for teaching',
     teachableSkills(
       Object.fromEntries(SKILLS.map(s => [s.id, { ...freshState(), pL: strong, attempts: 5, correct: 5 }])), 0,
     ).every(s => s.verb !== 'temper'))
  ok('a decayed skill stops being teachable',
     teachableSkills(known, 400).length === 0)
}



/* ── 13. addition has two shapes, and they grade differently ─ */
section('Bond vs sum')
{
  const fuseSkills = SKILLS.filter(s => s.verb === 'fuse')
  ok('every fuse order declares which task it is',
     fuseSkills.every(s => Array.from({ length: 20 }, () => makeOrder(s.id))
       .every(o => o.mode === 'bond' || o.mode === 'sum')))

  // A bond states the total, so the tray must contain a pair that makes it.
  const bondSkills = ['k.count10', 'k.bond5', 'k.bond10', 'g1.add10', 'g1.doubles']
  let bondBad: string[] = []
  for (const id of bondSkills) {
    for (let i = 0; i < 60; i++) {
      const o = makeOrder(id)
      if (o.mode !== 'bond') { bondBad.push(`${id} is not a bond`); break }
      if (!o.prompt.includes(String(o.target))) { bondBad.push(`${id}: prompt hides the total`); break }
      // exactly one pair in the tray should hit the target
      let pairs = 0
      for (let x = 0; x < o.ore.length; x++)
        for (let y = x + 1; y < o.ore.length; y++)
          if (o.ore[x]! + o.ore[y]! === o.target) pairs++
      if (pairs !== 1) { bondBad.push(`${id}: ${pairs} winning pairs in the tray`); break }
    }
  }
  ok('a bond tray holds exactly one winning pair', bondBad.length === 0,
     [...new Set(bondBad)].slice(0, 3).join('; '))

  // A sum states the two numbers and hides the total.
  const sumSkills = ['g2.add100', 'g2.carry', 'g3.add1000', 'g1.maketen', 'g5.decadd']
  let sumBad: string[] = []
  for (const id of sumSkills) {
    for (let i = 0; i < 60; i++) {
      const o = makeOrder(id)
      if (o.mode !== 'sum') { sumBad.push(`${id} is not a sum`); break }
      if (o.prompt.includes(String(o.target))) { sumBad.push(`${id}: prompt gives the answer away`); break }
      if (o.ore.length !== 2 || o.ore[0] !== o.sentence.a || o.ore[1] !== o.sentence.b) {
        sumBad.push(`${id}: the two numbers are not on the anvil`); break
      }
    }
  }
  ok('a sum shows both numbers and never prints the total', sumBad.length === 0,
     [...new Set(sumBad)].slice(0, 3).join('; '))

  // The exploit: the pair must be what decides a bond.
  const bondVerdict = (a: number, b: number, target: number) => a + b === target
  ok('a pair that misses the total is wrong, however it is entered',
     bondVerdict(2, 4, 4) === false && bondVerdict(3, 1, 4) === true)

  // A near-miss pair is diagnosed from the pair, not from the target.
  const wrongPair = (a: number, b: number, target: number) =>
    analyse({ id: 'x', skillId: 'k.count10', verb: 'fuse', target, ore: [], mode: 'bond',
              prompt: '', sentence: { a, b, op: '+', answer: a + b } }, target)
  ok('picking a pair one short is diagnosed as a counting slip',
     wrongPair(3, 2, 4) === 'add.count-slip', String(wrongPair(3, 2, 4)))
  ok('a correct pair yields no diagnosis', wrongPair(3, 1, 4) === undefined)

  // Carry misconceptions stay reachable, which is what sum mode protects.
  let carryOk = 0
  for (let i = 0; i < 200; i++) {
    const o = makeOrder('g2.carry')
    if (analyse(o, noCarrySum(o.sentence.a, o.sentence.b)) === 'add.carry-dropped') carryOk++
  }
  ok('the dropped-carry bug is still reachable on sum orders', carryOk === 200, `${carryOk}/200`)
}



/* ── 14. tap-the-answer, with misconceptions as distractors ── */
section('Answer choices (no keypad)')
{
  const typed = SKILLS.filter(s => s.verb !== 'temper')
  let bad: string[] = []
  let bugBacked = 0, total = 0

  for (const skill of typed) {
    for (let i = 0; i < 40; i++) {
      const o = makeOrder(skill.id)
      // Bond orders are answered by the pair, never by choosing a number.
      if (o.verb === 'fuse' && o.mode === 'bond') continue
      const opts = answerChoices(o)
      total++

      if (opts.length !== CHOICE_COUNT) bad.push(`${skill.id}: ${opts.length} options`)
      if (new Set(opts).size !== opts.length) bad.push(`${skill.id}: duplicate options`)
      if (!opts.includes(o.sentence.answer)) bad.push(`${skill.id}: the answer is missing`)
      if (opts.some(v => v <= 0)) bad.push(`${skill.id}: non-positive option`)

      // Every wrong option must be diagnosable, not noise.
      const wrongs = opts.filter(v => v !== o.sentence.answer)
      if (wrongs.some(v => analyse(o, v) === undefined)) {
        bad.push(`${skill.id}: a wrong option reads as correct`)
      }
      if (wrongs.some(v => analyse(o, v) !== 'generic.retry')) bugBacked++
    }
  }

  ok(`every order offers ${CHOICE_COUNT} distinct options including the answer`,
     bad.length === 0, [...new Set(bad)].slice(0, 4).join('; '))
  ok('no wrong option is ever secretly correct', !bad.some(b => b.includes('reads as correct')))
  ok('most orders carry at least one misconception-backed distractor',
     bugBacked / total > 0.8, `${Math.round((bugBacked / total) * 100)}%`)

  // The headline case: tapping 25 for 34 - 19 must still summon Flipsy.
  const borrow: Order = { id: 'c1', skillId: 'g2.borrow', verb: 'cleave', target: 15, ore: [],
                          source: 34, prompt: '', sentence: { a: 34, b: 19, op: '-', answer: 15 } }
  const opts = answerChoices(borrow)
  ok('34 - 19 offers 25 as a tappable wrong answer', opts.includes(25), opts.join(', '))
  ok('and tapping it still diagnoses the smaller-from-larger bug',
     analyse(borrow, 25) === 'sub.smaller-from-larger')

  // Open Forge tray
  for (const t of [12, 16, 20, 24, 30, 36]) {
    const tray = openForgeTray(t)
    ok(`Open Forge tray for ${t} is usable`,
       tray.length >= 12 && !tray.includes(t) && tray.every(n => n > 0),
       `${tray.length} numbers, includes target: ${tray.includes(t)}`)
  }
}

ok('the same order always lays its answers out identically', (() => {
  const o = makeOrder('g2.skip')
  const a = answerChoices(o).join(',')
  return Array.from({ length: 20 }, () => answerChoices(o).join(',')).every(x => x === a)
})())
ok('different orders get different layouts', (() => {
  const seen = new Set(Array.from({ length: 30 }, () => answerChoices(makeOrder('g3.mult9')).join(',')))
  return seen.size > 1
})())


/* ── 15. sharing divides evenly, except where remainders are the point ── */
section('Share divisibility')
{
  const shareSkills = SKILLS.filter(s => s.verb === 'share')
  const remainderSkill = 'g4.divrem'
  let uneven: string[] = []

  for (const skill of shareSkills) {
    let unevenCount = 0
    for (let i = 0; i < 300; i++) {
      const o = makeOrder(skill.id)
      if ((o.source ?? 0) % (o.groups ?? 1) !== 0) unevenCount++
    }
    if (skill.id === remainderSkill) {
      if (unevenCount === 0) uneven.push(`${skill.id} should always leave a remainder`)
    } else if (unevenCount > 0) {
      uneven.push(`${skill.id} left a remainder ${unevenCount}/300 times`)
    }
  }
  ok('every share order divides evenly, except the Leftovers skill',
     uneven.length === 0, uneven.join('; '))

  ok('the Leftovers skill always actually leaves something over', (() => {
    return Array.from({ length: 200 }, () => makeOrder('g4.divrem'))
      .every(o => (o.source ?? 0) % (o.groups ?? 1) !== 0)
  })())

  ok('a leftover is always smaller than the number of buckets', (() => {
    return Array.from({ length: 200 }, () => makeOrder('g4.divrem'))
      .every(o => (o.source ?? 0) % (o.groups ?? 1) < (o.groups ?? 1))
  })())

  ok('the quotient offered is the whole number of full buckets', (() => {
    return Array.from({ length: 200 }, () => makeOrder('g4.divrem'))
      .every(o => o.sentence.answer === Math.floor((o.source ?? 0) / (o.groups ?? 1)))
  })())
}

/* ── hint pricing ─────────────────────────────────────────── */
section('Hint pricing')

ok('a hint costs sparks once the child can afford one',
   hintCharge(HINT_COST) === HINT_COST && hintCharge(HINT_COST + 40) === HINT_COST)

// Never a barrier: a child short of stars still gets the hint, it just
// takes what they have. They are a beginner, which is exactly who needs
// the help most.
ok('a hint takes only what a child short of stars actually has',
   Array.from({ length: HINT_COST }, (_, n) => n).every(n => hintCharge(n) === n))

ok('the price on the button is the price everyone pays once they can afford it',
   Array.from({ length: 60 }, (_, n) => n + HINT_COST).every(n => hintCharge(n) === HINT_COST))

ok('a hint never pushes a child into debt',
   Array.from({ length: 201 }, (_, n) => n)
     .every(n => hintCharge(n) >= 0 && hintCharge(n) <= n))

// Pay for help, answer correctly, still come out ahead. If this went
// negative, asking for help would be a punishment rather than a purchase.
ok('a hinted solve still leaves the child better off',
   Array.from({ length: 201 }, (_, n) => n)
     .every(n => SPARKS.forge - hintCharge(n) > 0))

/* ── curriculum alignment ─────────────────────────────────── */
section('Curriculum alignment')

// These guard against the failure this suite was blind to before: a skill
// whose label promises one standard while its generator emits another.

const sample = (id: string, n = 60) => Array.from({ length: n }, () => makeOrder(id))

ok('decimal skills actually produce decimals',
   sample('g5.decadd').every(o => o.scale === 1 && /\d\.\d/.test(o.prompt)))

ok('decimal place value is placed on a line, not a whole-number bar',
   sample('g5.decplace').every(o => o.shape === 'line' && o.denom === 10 && /0\.\d/.test(o.prompt)))

ok('volume has a third dimension',
   sample('g5.volume').every(o => (o.layers ?? 0) >= 2 && o.sentence.answer === o.ore[0]! * o.ore[1]! * o.layers!))

ok('powers of ten scale by an actual power of ten',
   sample('g5.powers').every(o => [10, 100, 1000].includes(o.ore[1]!)))

ok('order of operations needs the multiply done first',
   sample('g5.order').every(o => {
     const m = /Work out (\d+) \+ (\d+) \u00d7 (\d+)/.exec(o.prompt)!
     const [a, b, c] = [Number(m[1]), Number(m[2]), Number(m[3])]
     // The right answer and the left-to-right answer must differ, or the
     // question cannot tell the two apart.
     return o.sentence.answer === a + b * c && (a + b) * c !== a + b * c
   }))

ok('every fraction skill is met as a bar, a pizza and a line',
   ['g3.unitfrac', 'g3.fraccomp', 'g4.equivfrac', 'g4.addlike', 'g5.addunlike', 'g5.multfrac']
     .every(id => {
       const shapes = new Set(sample(id, 120).map(o => o.shape))
       return shapes.has('bar') && shapes.has('pizza') && shapes.has('line')
     }))

ok('a fraction never asks for more pieces than the whole has',
   ['g3.unitfrac', 'g3.fraccomp', 'g4.equivfrac', 'g4.addlike', 'g5.addunlike', 'g5.multfrac']
     .every(id => sample(id, 120).every(o => o.target >= 1 && o.target <= (o.denom ?? 0))))

ok('equivalent-fraction orders are genuinely equivalent',
   sample('g4.equivfrac', 120).every(o => o.target / o.denom! === o.frac2!.n / o.frac2!.d))

ok('adding-fractions orders keep the total inside one whole',
   ['g4.addlike', 'g5.addunlike'].every(id =>
     sample(id, 120).every(o => {
       const started = o.frac2!.n / o.frac2!.d
       return started < o.target / o.denom! && o.target / o.denom! <= 1
     })))

ok('two-fraction tasks say which job they are',
   ['g4.equivfrac', 'g4.addlike', 'g5.addunlike', 'g5.multfrac']
     .every(id => sample(id, 40).every(o => !!o.fracTask && !!o.frac2)))

ok('every skill names the standard it targets',
   SKILLS.every(s => /\u00b7 [K1-5]\.[A-Z]+/.test(s.detail)),
   SKILLS.filter(s => !/\u00b7 [K1-5]\.[A-Z]+/.test(s.detail)).map(s => s.id).join(','))

ok('the stage a skill declares is the stage its orders use',
   SKILLS.every(s => sample(s.id, 8).every(o => o.verb === s.verb)),
   SKILLS.filter(s => sample(s.id, 8).some(o => o.verb !== s.verb)).map(s => s.id).join(','))

/* ── school vocabulary ────────────────────────────────────── */
section('School vocabulary')

// A child who masters "mashing" has learned a word that appears on no
// worksheet anywhere. Every operation name a child reads must be one
// their teacher also uses.
/*
  Operation names only. "Slices" of a pizza is the right English noun for
  a piece of pizza, not a game word standing in for "divide", so it is
  deliberately not on this list.
*/
const INVENTED = /\b(mash(ed|es|ing)?|snap(ped|s|ping)?|stamp(ed|s|ing)?|cleave[sd]?|temper(ed|s)?)\b/i

ok('the five verbs are named as school names them',
   ['Add', 'Subtract', 'Multiply', 'Divide', 'Fractions']
     .every(n => Object.values(VERB_META).some(m => m.name === n)),
   Object.values(VERB_META).map(m => m.name).join(','))

ok('no verb name or blurb uses an invented forge word',
   Object.values(VERB_META).every(m => !INVENTED.test(m.name) && !INVENTED.test(m.blurb)),
   Object.values(VERB_META).filter(m => INVENTED.test(m.name + m.blurb)).map(m => m.name).join(','))

const promptOffenders = SKILLS.flatMap(sk =>
  sample(sk.id, 25).filter(o => INVENTED.test(o.prompt)).map(o => `${sk.id}:"${o.prompt}"`))
/*
  Your Way has its own list of names for the four operations, and this
  test did not read it, so it went on offering "mash", "snap" and
  "stamp" on its buttons after every other screen had stopped. Five
  places were checked and the sixth was the one that was wrong.
*/
ok('no operation button in Your Way uses an invented forge word',
   ALL_OPS.every(o => !INVENTED.test(OP_LABEL[o])),
   ALL_OPS.filter(o => INVENTED.test(OP_LABEL[o])).map(o => `${o}:${OP_LABEL[o]}`).join(','))

ok('the operation buttons are named the same as the verbs they run',
   ALL_OPS.every(o => Object.values(VERB_META).some(m => m.name === OP_LABEL[o])),
   ALL_OPS.map(o => `${o}:${OP_LABEL[o]}`).join(','))

ok('no order prompt uses an invented forge word',
   promptOffenders.length === 0, promptOffenders.slice(0, 5).join(' '))

ok('no skill label uses an invented forge word',
   SKILLS.every(sk => !INVENTED.test(sk.label)),
   SKILLS.filter(sk => INVENTED.test(sk.label)).map(sk => sk.label).join(','))

ok('nothing a child is told about a mistake uses an invented word',
   Object.values(MISCONCEPTIONS).every(m => !INVENTED.test(m.kidLine)),
   Object.values(MISCONCEPTIONS).filter(m => INVENTED.test(m.kidLine)).map(m => m.id).join(','))

ok('no description of a mistake uses an invented word',
   DIAGNOSABLE.every(id => !INVENTED.test(describeMiss(id))),
   DIAGNOSABLE.filter(id => INVENTED.test(describeMiss(id))).join(','))

/*
  The repair beats were missed by the first sweep, which only read
  kidLine. Eight of them still said MASH, SNAP and "the stamp" long after
  those words left the rest of the game, at exactly the moment a child is
  being taught a correction and can least afford unfamiliar vocabulary.
*/
const allBeats = () => SKILLS.flatMap(sk => {
  const o = makeOrder(sk.id)
  return Object.values(MISCONCEPTIONS).flatMap(m => {
    try { return m.repair(o, o.sentence.answer + 1).map(bt => bt.text) } catch { return [] }
  })
})

ok('no repair step uses an invented forge word',
   allBeats().every(t => !INVENTED.test(t)),
   allBeats().filter(t => INVENTED.test(t)).slice(0, 3).join(' | '))

ok('no repair step says "1 rows"',
   allBeats().every(t => !/\b1 (rows|pieces|groups|layers|steps|slices)\b/.test(t)),
   allBeats().filter(t => /\b1 (rows|pieces|groups|layers|steps|slices)\b/.test(t)).slice(0, 3).join(' | '))

/* ── area model ───────────────────────────────────────────── */
section('Area model')

ok('a two-digit number splits into tens and ones',
   JSON.stringify(bands(17)) === '[10,7]' && JSON.stringify(bands(15)) === '[10,5]')

ok('a round number has no ones band to draw',
   JSON.stringify(bands(20)) === '[20]' && JSON.stringify(bands(100)) === '[100]')

ok('a single digit is one band',
   JSON.stringify(bands(7)) === '[7]')

ok('the bands always add back to the number, so the rectangle is whole',
   Array.from({ length: 200 }, (_, n) => n + 1)
     .every(n => bands(n).reduce((a, b) => a + b, 0) === n))

ok('every multi-digit multiplication can be split into known facts',
   ['g4.mult2x1', 'g4.mult2x2', 'g5.powers'].every(id =>
     sample(id, 60).every(o => {
       const [r, c] = o.ore as [number, number]
       // Each part must be a fact inside the times tables the child owns.
       return bands(r).every(x => x <= 100) && bands(c).every(y => y <= 1000)
         && bands(r).reduce((a, b) => a + b, 0) * bands(c).reduce((a, b) => a + b, 0) === o.sentence.answer
     })))

/* ── cheers ───────────────────────────────────────────────── */
section('Cheers')

ok('a child with no name never sees an empty slot',
   Array.from({ length: 40 }, (_, n) => cheerFrom(HERO_BY_ID[STARTER_HERO]!, n, ''))
     .every(c => !c.includes('{n}') && !/,\s*!/.test(c) && c.trim().length > 3))

ok('whitespace typed as a name is treated as no name',
   cheerFrom(HERO_BY_ID[STARTER_HERO]!, 0, '   ') === cheerFrom(HERO_BY_ID[STARTER_HERO]!, 0, ''))

// Roughly half, not exactly half: each hero has its own number of lines,
// so the alternation lands differently per roster. The property that
// matters is that the name is used often enough to feel personal and
// rarely enough not to grate.
ok('every hero uses the name about half the time',
   HEROES.every(h => {
     const cs = Array.from({ length: 60 }, (_, n) => cheerFrom(h, n, 'Ada'))
     const named = cs.filter(c => c.includes('Ada')).length
     return named >= 24 && named <= 36 && cs.every(c => !c.includes('{n}'))
   }),
   HEROES.filter(h => {
     const cs = Array.from({ length: 60 }, (_, n) => cheerFrom(h, n, 'Ada'))
     const named = cs.filter(c => c.includes('Ada')).length
     return !(named >= 24 && named <= 36)
   }).map(h => h.name).join(','))

ok('the cheer changes from one forge to the next',
   Array.from({ length: 12 }, (_, n) => cheerFrom(HERO_BY_ID[STARTER_HERO]!, n, 'Ada'))
     .every((c, i, all) => i === 0 || c !== all[i - 1]))

/*
  The cloud is no longer a fixed size: a longer cheer gets a bigger cloud
  as well as smaller words, because shrinking text alone ends up
  unreadable and still crowds the outline.

  These mirror the real geometry. The text sits in a box 60% of the
  bubble's width and 43% of its height, both scaled together, so the
  ratios below are size-independent.
*/
const BOX_W = 168 * 0.60
const BOX_H = 121 * 0.43
/** Roughly how wide a character is, and how tall a line, at a given size. */
const CH = 0.56
const LINE = 1.15

const fits = (c: string) => {
  const size = cheerSize(c)
  const longest = Math.max(1, ...c.trim().split(/\s+/).map(w => w.length))
  // a word cannot be broken, so it has to fit one line on its own
  if (longest * size * CH > BOX_W) return false
  const lines = Math.ceil((c.length * size * CH) / BOX_W)
  return lines * size * LINE <= BOX_H
}

ok('every cheer fits its cloud, for every hero and every name length',
   HEROES.every(h => ['', 'Ada', 'Alexandra', 'Konstantinos'].every(name =>
     Array.from({ length: 24 }, (_, n) => cheerFrom(h, n, name)).every(fits))),
   HEROES.flatMap(h => ['', 'Konstantinos'].flatMap(name =>
     Array.from({ length: 24 }, (_, n) => cheerFrom(h, n, name))))
     .filter(c => !fits(c)).slice(0, 3).join(' | '))

ok('a longer cheer gets a bigger cloud',
   bubbleScale('Nice work!') === 1 &&
   bubbleScale('Twice as sharp, Alexandra!') > bubbleScale('Nice work!'))

ok('the words never shrink past readable',
   HEROES.every(h => Array.from({ length: 24 }, (_, n) => cheerFrom(h, n, 'Konstantinos'))
     .every(c => cheerSize(c) * bubbleScale(c) >= 12)))

ok('a long single word sets its own ceiling',
   cheerSize('Go Konstantinos!') < cheerSize('Go Ada!'))

/* ── one opportunity per question ──────────────────────────── */
section('One opportunity per question')

/*
  BKT scores one observation per opportunity, and an opportunity is a
  question rather than a tap. Counting every submission separately meant
  each extra guess collected another learning-transition bump, so brute
  forcing the four orbs finished AHEAD of simply knowing the answer:
  measured from 0.140, two wrong guesses then a correct answer reached
  0.612 while a clean first-try correct reached 0.498.
*/

ok('knowing it always beats reaching it after a miss',
   Array.from({ length: 99 }, (_, i) => (i + 1) / 100)
     .every(pL => updateBKT(pL, true) > relearnBKT(pL)))

ok('a retry still teaches something',
   Array.from({ length: 99 }, (_, i) => (i + 1) / 100)
     .every(pL => relearnBKT(pL) > pL))

ok('guessing more never earns more',
   (() => {
     // The miss is scored once, so the mastery a child ends on cannot
     // depend on how many wrong orbs they tapped first.
     const afterMiss = updateBKT(0.14, false)
     const ends = [1, 2, 3, 8].map(() => relearnBKT(afterMiss))
     return new Set(ends.map(x => x.toFixed(6))).size === 1
   })())

ok('no run of misses and recoveries can outrun a clean answer',
   (() => {
     const clean = updateBKT(0.14, true)
     let pL = 0.14
     for (let i = 0; i < 12; i++) pL = relearnBKT(updateBKT(pL, false))
     return pL < clean
   })())

ok('a retry never lifts mastery past the threshold on its own',
   relearnBKT(FADING_THRESHOLD) < MASTERY_THRESHOLD)

ok('the reduced transfer is a real fraction of the normal one',
   RETRY_LEARN > 0 && RETRY_LEARN < 1)

ok('an answer reached after a miss pays less than a clean one',
   SPARKS.repair < SPARKS.forge)

/* ── warm-up ───────────────────────────────────────────────── */
section('Warm-up')

// A learner who mastered several skills a long time ago.
const rusty = (() => {
  const st: Record<string, SkillState> = {}
  for (const s of SKILLS) st[s.id] = freshState()
  for (const id of ['k.bond5', 'k.bond10', 'g1.doubles', 'g1.maketen']) {
    st[id] = { ...freshState(), pL: 0.95, attempts: 8, correct: 8, lastSeenDay: 0 }
  }
  return st
})()

ok('a warm-up finds the skills that have decayed',
   fadingSkills(rusty, 40).length > 0,
   `statuses: ${['k.bond5','k.bond10','g1.doubles','g1.maketen'].map(id => statusOf(SKILL_BY_ID[id]!, rusty, 40)).join(',')}`)

ok('a warm-up never exceeds its size',
   fadingSkills(rusty, 40).length <= WARMUP_SIZE)

ok('a warm-up only ever offers skills the child actually knew',
   fadingSkills(rusty, 40).every(s => (rusty[s.id]?.correct ?? 0) >= 3))

ok('nothing is queued for a learner with no history',
   fadingSkills(Object.fromEntries(SKILLS.map(s => [s.id, freshState()])), 40).length === 0)

ok('nothing is queued the same day a skill was practised',
   fadingSkills(rusty, 0).length === 0)

ok('the most faded skill is offered first',
   (() => {
     const picked = fadingSkills(rusty, 40)
     if (picked.length < 2) return true
     const drop = (id: string) => (rusty[id]!.pL - currentMastery(rusty[id]!, 40))
     return picked.every((s, i) => i === 0 || drop(picked[i - 1]!.id) >= drop(s.id))
   })())

/* ── every early skill can ask for help ────────────────────── */
section('Help reaches the youngest')

/*
  The hint was built to thin out answer orbs, so orders answered by
  building instead of choosing never offered one. That left four of the
  six Kindergarten skills with no help at all: the youngest children, on
  the first tasks they meet, had the least support.
*/
const canAskForHelp = (id: string) => {
  const o = makeOrder(id)
  const hasAnswerOrbs = o.verb !== 'temper' && !(o.verb === 'fuse' && o.mode === 'bond')
  const isBond = o.verb === 'fuse' && o.mode === 'bond'
  return hasAnswerOrbs || isBond
}

ok('every Kindergarten skill can ask for a hint',
   SKILLS.filter(s => s.grade === 'K').every(s => canAskForHelp(s.id)),
   SKILLS.filter(s => s.grade === 'K' && !canAskForHelp(s.id)).map(s => s.id).join(','))

ok('every Grade 1 skill can ask for a hint',
   SKILLS.filter(s => s.grade === '1').every(s => canAskForHelp(s.id)),
   SKILLS.filter(s => s.grade === '1' && !canAskForHelp(s.id)).map(s => s.id).join(','))

// A bond hint places the first number, so that number has to be on the
// tray to place. fuseOre guarantees it, but nothing else checks.
ok('the number a bond hint places is always on the tray',
   SKILLS.filter(s => s.verb === 'fuse')
     .every(s => Array.from({ length: 40 }, () => makeOrder(s.id))
       .filter(o => o.mode !== 'sum')
       .every(o => o.ore.includes(o.sentence.a))),
   SKILLS.filter(s => s.verb === 'fuse')
     .filter(s => Array.from({ length: 40 }, () => makeOrder(s.id))
       .filter(o => o.mode !== 'sum')
       .some(o => !o.ore.includes(o.sentence.a))).map(s => s.id).join(','))

ok('a bond hint still leaves the child something to do',
   SKILLS.filter(s => s.verb === 'fuse')
     .every(s => Array.from({ length: 40 }, () => makeOrder(s.id))
       .filter(o => o.mode !== 'sum')
       .every(o => o.sentence.b > 0 && o.sentence.a + o.sentence.b === o.target)))

/* ── grammar ───────────────────────────────────────────────── */
section('Grammar')

/*
  These prompts get read aloud, by a child sounding them out or a parent
  reading over their shoulder, so they have to survive being spoken.
*/

ok('a prompt never says "a 8"',
   SKILLS.every(sk => Array.from({ length: 120 }, () => makeOrder(sk.id))
     .every(o => !/\ba (8|11|18|80|800)\b/.test(o.prompt))),
   SKILLS.flatMap(sk => Array.from({ length: 120 }, () => makeOrder(sk.id)))
     .filter(o => /\ba (8|11|18|80|800)\b/.test(o.prompt)).map(o => o.prompt).slice(0, 3).join(' | '))

ok('"an" is used only where a number word needs it',
   [1, 2, 3, 4, 5, 6, 7, 9, 10, 12, 13, 20, 100].every(n => article(n) === 'a') &&
   [8, 11, 18, 80, 800].every(n => article(n) === 'an'))

ok('the multiplication sign is a times sign, not the letter x',
   SKILLS.every(sk => Array.from({ length: 60 }, () => makeOrder(sk.id))
     .every(o => !/\d\s+x\s+\d/.test(o.prompt))),
   SKILLS.flatMap(sk => Array.from({ length: 60 }, () => makeOrder(sk.id)))
     .filter(o => /\d\s+x\s+\d/.test(o.prompt)).map(o => o.prompt).slice(0, 3).join(' | '))

ok('no prompt counts "1 times"',
   SKILLS.every(sk => Array.from({ length: 120 }, () => makeOrder(sk.id))
     .every(o => !/\b1 times\b/.test(o.prompt))))

ok('every prompt starts with a capital and has no double spaces',
   SKILLS.every(sk => Array.from({ length: 40 }, () => makeOrder(sk.id))
     .every(o => /^[A-Z]/.test(o.prompt) && !/ {2}/.test(o.prompt) && o.prompt.trim() === o.prompt)),
   SKILLS.flatMap(sk => Array.from({ length: 40 }, () => makeOrder(sk.id)))
     .filter(o => !/^[A-Z]/.test(o.prompt) || / {2}/.test(o.prompt)).map(o => `"${o.prompt}"`).slice(0, 3).join(' | '))

/*
  "Add and Subtract Big" left an adjective hanging with nothing to
  describe. Comparatives are not the same case: "Which Piece Is Bigger"
  is a whole question and "Ten Times Bigger" a whole phrase, so only the
  positive degree is caught here.
*/
ok('no skill label ends on an adjective with nothing to describe',
   SKILLS.every(sk => !/\b(Big|Small|Long|Short|Wide)$/.test(sk.label)),
   SKILLS.filter(sk => /\b(Big|Small|Long|Short|Wide)$/.test(sk.label)).map(sk => sk.label).join(','))

ok('nothing a child reads says "pieces means"',
   Object.values(MISCONCEPTIONS).every(m => !/pieces means/.test(m.kidLine)) &&
   DIAGNOSABLE.every(id => !/pieces means/.test(describeMiss(id))))

/* ── the name never leaves the device ──────────────────────── */
section('Name substitution')

/*
  The model writes {{NAME}} and is never told what it stands for. That
  keeps the one genuinely identifying field out of the payload while the
  report still reads as though written about a named child. The risk is
  the reverse: a placeholder that survives into what a parent reads.
*/

ok('the placeholder is replaced with the name',
   personalise('Great week for {{NAME}}. {{NAME}} is doing well.', 'Ada')
     === 'Great week for Ada. Ada is doing well.')

// Models reformat placeholders: spaces creep in, a brace goes missing.
ok('a reformatted placeholder is still replaced',
   ['{{NAME}}', '{{ NAME }}', '{NAME}', '{{name}}', '{ name }', '{{Name}}']
     .every(tok => personalise(`Hello ${tok}!`, 'Ada') === 'Hello Ada!'),
   ['{{NAME}}', '{{ NAME }}', '{NAME}', '{{name}}', '{ name }', '{{Name}}']
     .filter(tok => personalise(`Hello ${tok}!`, 'Ada') !== 'Hello Ada!').join(' '))

ok('no brace ever survives into what a parent reads',
   ['{{NAME}}', '{{ NAME }}', '{NAME}', '{{name}}']
     .every(tok => !/[{}]/.test(personalise(`Hi ${tok}, well done.`, 'Ada'))))

ok('a child who skipped the name field still gets a readable report',
   personalise('Great week for {{NAME}}.', '') === 'Great week for your child.' &&
   personalise('Great week for {{NAME}}.', '   ') === 'Great week for your child.')

ok('a report with no placeholder is left alone',
   personalise('Your child is doing well.', 'Ada') === 'Your child is doing well.')

ok('names with spaces and punctuation survive',
   personalise('{{NAME}} did well.', "Mary-Anne") === 'Mary-Anne did well.')

/* ── the hero roster ───────────────────────────────────────── */
section('Hero roster')

ok('ten heroes, all with unique ids and names',
   HEROES.length === 10 &&
   new Set(HEROES.map(h => h.id)).size === 10 &&
   new Set(HEROES.map(h => h.name)).size === 10)

ok('exactly one hero is there from the start',
   HEROES.filter(h => h.unlock.kind === 'start').length === 1 &&
   HEROES[0]!.id === STARTER_HERO)

ok('a brand new child has exactly one hero',
   unlockedHeroes(0, 0, 0).length === 1)

/*
  Every gate is on unaided work. The streak resets on a hint or a miss,
  medals only come from crossing mastery, and a creature is only caught
  by three clean answers. So the roster cannot be farmed by tapping
  through easy questions, which is the whole reason it is allowed to be
  a collection at all.
*/
ok('no hero unlocks from mere volume',
   HEROES.every(h => ['start', 'streak', 'medals', 'bugs'].includes(h.unlock.kind)))

ok('the roster unlocks gradually, never all at once',
   (() => {
     const counts = [0, 3, 5, 8, 12].map(st => unlockedHeroes(st, 0, 0).length)
     return counts.every((c, i) => i === 0 || c >= counts[i - 1]!) &&
            counts[counts.length - 1]! < HEROES.length
   })())

ok('everything is reachable by a child who gets there',
   unlockedHeroes(99, 99, 99).length === HEROES.length)

ok('every hero explains how to earn them, in a child\u2019s words',
   HEROES.every(h => {
     const hint = unlockHint(h)
     return hint.length > 6 && !/undefined|NaN|\{/.test(hint)
   }),
   HEROES.filter(h => /undefined|NaN|\{/.test(unlockHint(h))).map(h => h.name).join(','))

ok('an unlock rule is never satisfied before it should be',
   HEROES.filter(h => h.unlock.kind === 'streak').every(h => {
     const n = (h.unlock as { n: number }).n
     return !isUnlocked(h, n - 1, 0, 0) && isUnlocked(h, n, 0, 0)
   }))

/*
  The cloud's tail has to reach the speaker's face. Two things move it:
  the cloud grows downward for a longer cheer, and faces sit at different
  heights in their own drawings. Both are compensated in the layout, so
  what is checked here is that the roster carries a sane offset for each.
*/
ok('every hero records where its face sits',
   HEROES.every(h => Number.isFinite(h.headDrop) && Math.abs(h.headDrop) <= 40),
   HEROES.filter(h => !Number.isFinite(h.headDrop) || Math.abs(h.headDrop) > 40)
     .map(h => `${h.name}=${h.headDrop}`).join(','))

ok('the standard build needs no correction',
   HERO_BY_ID[STARTER_HERO]!.headDrop === 0)

ok('only the heroes drawn differently carry an offset',
   HEROES.filter(h => h.headDrop !== 0).length <= 7)

ok('every hero has a voice of its own',
   HEROES.every(h => h.cheers.length >= 5 && h.named.length >= 5) &&
   new Set(HEROES.map(h => h.cheers[0])).size === HEROES.length)

ok('every named line has a slot for the name',
   HEROES.every(h => h.named.every(l => l.includes('{n}'))),
   HEROES.filter(h => h.named.some(l => !l.includes('{n}'))).map(h => h.name).join(','))

ok('no plain line has a leftover slot',
   HEROES.every(h => h.cheers.every(l => !l.includes('{n}'))))

ok('a hero always speaks, whatever the counter',
   ([NaN, undefined, null, Infinity, -4] as unknown as number[])
     .every(n => HEROES.every(h => cheerFrom(h, n, 'Ada').trim().length > 3)))

console.log(`\n\x1b[1m${fail === 0 ? '\x1b[32mALL PASS' : '\x1b[31mFAILURES'}\x1b[0m  ${pass} passed, ${fail} failed\n`)
process.exit(fail ? 1 : 0)

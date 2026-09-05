import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SKILLS, SKILL_BY_ID } from '../engine/skills'
import {
  freshState, updateBKT, currentMastery, selectNextSkill,
  relearnBKT, fadingSkills, statusOf, summarise, MASTERY_THRESHOLD,
} from '../engine/mastery'
import { makeOrder } from '../engine/orders'
import { analyse, analyseTemper } from '../engine/misconceptions'
import {
  type Op, type Rejection, checkWay, pickTarget, unlockedOps, goalFor, OPEN_SPARKS,
} from '../engine/openforge'
import { type Round, buildRound, pickTeachSkill, TEACH_SPARKS } from '../engine/apprentice'
import { SPARKS, HINT_COST, hintCharge } from '../engine/strategies'
import { unlockedHeroes, STARTER_HERO } from '../engine/heroes'
import type { Order, SkillState, Grade } from '../engine/types'
import * as S from '../audio/sound'

export type Screen = 'title' | 'forge' | 'constellation' | 'dashboard' | 'open' | 'teach' | 'heroes'
export type Phase =
  | 'building'    // arranging the physical structure on the anvil
  | 'calling'     // entering the predicted value
  | 'striking'    // hammer animation in flight
  | 'forged'      // success flourish
  | 'strategy'    // "how did you do it?"
  | 'repair'      // guided misconception repair

/** One "make 24 any way you like" session. */
export interface OpenSession {
  target: number
  /** Canonical keys of every distinct way found, in order. */
  found: string[]
  /** Human-readable version of each, for the board. */
  ways: Array<{ a: number; op: Op; b: number }>
  /** Operations already used on this target. */
  opsUsed: Op[]
  /** How many ways to aim for on this target. */
  goal: number
  /** True once the goal has been reached, so it celebrates only once. */
  goalHit: boolean
  a: string
  b: string
  op: Op
  slot: 'a' | 'b'
  feedback: { kind: 'new' | 'newOp' | 'goal' | 'dup' | Rejection; value?: number | null } | null
}

/** One teaching round with Pip. */
export interface TeachSession {
  skillId: string
  round: Round
  /** 'verdict' -> is Pip right?  'diagnose' -> what did Pip do?  'done'. */
  step: 'verdict' | 'diagnose' | 'done'
  /** What the child said about whether Pip was right. */
  saidWrong: boolean | null
  /** Which bug the child picked. */
  picked: string | null
  /** Whether their verdict was correct. */
  verdictOk: boolean | null
  /** Whether their diagnosis was correct. */
  diagnosisOk: boolean | null
  earned: number
}

interface Game {
  /* ── persisted learner model ── */
  states: Record<string, SkillState>
  /** The child's own mistakes, as creatures. Keyed by misconception id. */
  sparks: number
  /** What the child likes to be called. Optional, and never leaves the device. */
  playerName: string
  /** Which hero turns up to cheer. The child's pick. */
  activeHero: string
  /** A hero that has just joined, so the forge can announce it once. */
  justUnlockedHero: string | null
  ingots: number
  /** Simulated day counter, drives the forgetting curve. */
  day: number
  /** Best haul on any single Open Forge target. */
  bestWays: number
  /** How many teaching rounds the child has got fully right. */
  taught: number
  badges: string[]
  totalForges: number
  bestStreak: number
  gradeFilter: Grade | null
  soundOn: boolean

  /* ── transient session state ── */
  screen: Screen
  phase: Phase
  order: Order | null
  recent: string[]
  streak: number
  called: string
  misconception: string | null
  repairBeat: number
  open: OpenSession | null
  teach: TeachSession | null
  lastAward: { sparks: number; label: string } | null
  justMastered: string | null
  /** Whether a hint was taken on the current order. */
  hintUsed: boolean
  /** Submissions made against the order now on screen. */
  attemptsThisOrder: number
  /**
   * Skills queued for the warm-up at the start of a run: things the child
   * knew and is starting to forget. Empty once the warm-up is done.
   */
  warmup: string[]
  /** How many the warm-up started with, for the progress line. */
  warmupTotal: number
  /** Whether the order on screen came from the warm-up queue. */
  inWarmup: boolean
  /** A bug that just popped out of a mistake, for the repair scene. */
  /** A bug just caught, for the celebration banner. */
  celebrate: number

  /* ── actions ── */
  start: () => void
  nextOrder: () => void
  setScreen: (s: Screen) => void
  setPhase: (p: Phase) => void
  submitChoice: (value: number) => void
  setPlayerName: (n: string) => void
  setActiveHero: (id: string) => void
  finishForge: () => void
  useHint: () => void
  submitTemper: (slices: number, taken: number) => void
  submitBond: (a: number, b: number) => void
  chooseStrategy: (id: string | null) => void
  advanceRepair: () => void
  finishRepair: () => void
  setGradeFilter: (g: Grade | null) => void
  advanceDays: (n: number) => void
  openStart: (fresh?: boolean) => void
  openKey: (k: string) => void
  openSetOp: (op: Op) => void
  openSetSlot: (slot: 'a' | 'b') => void
  openSubmit: () => void
  teachStart: () => void
  teachVerdict: (saidWrong: boolean) => void
  teachDiagnose: (bugId: string) => void
  seedDemo: () => void
  toggleSound: () => void
  resetAll: () => void
}

const initialStates = (): Record<string, SkillState> =>
  Object.fromEntries(SKILLS.map((s) => [s.id, freshState()]))

export const useGame = create<Game>()(
  persist(
    (set, get) => ({
      states: initialStates(),
      sparks: 0,
      playerName: '',
      activeHero: STARTER_HERO,
      justUnlockedHero: null,
      ingots: 0,
      day: 0,
      bestWays: 0,
      taught: 0,
      badges: [],
      totalForges: 0,
      bestStreak: 0,
      gradeFilter: null,
      soundOn: true,

      screen: 'title',
      phase: 'building',
      order: null,
      recent: [],
      streak: 0,
      called: '',
      misconception: null,
      repairBeat: 0,
      open: null,
      teach: null,
      lastAward: null,
      justMastered: null,
      hintUsed: false,
      attemptsThisOrder: 0,
      warmup: [],
      warmupTotal: 0,
      inWarmup: false,
      celebrate: 0,

      start: () => {
        /*
          A run opens with whatever the child is starting to forget. The
          decay model already steers what gets offered; queueing it here
          is what makes it something the child can see happening rather
          than a hidden weighting inside the selector.
        */
        const { states, day } = get()
        const faded = fadingSkills(states, day).map((s) => s.id)
        set({ screen: 'forge', warmup: faded, warmupTotal: faded.length })
        get().nextOrder()
      },

      nextOrder: () => {
        const { states, day, recent, gradeFilter, warmup } = get()
        /*
          The warm-up queue jumps the selector. It is drained one skill per
          order, and only while the skill is still actually fading: getting
          it right can lift it clear, and there is no sense drilling
          something the child has just shown they remember.
        */
        const queued = warmup.find((id) => statusOf(SKILL_BY_ID[id]!, states, day) === 'fading')
        const skill = queued
          ? SKILL_BY_ID[queued]!
          : selectNextSkill(states, day, recent.slice(-2), gradeFilter ?? undefined)
        set({
          warmup: queued ? warmup.filter((id) => id !== queued) : [],
          warmupTotal: queued ? get().warmupTotal : 0,
          inWarmup: !!queued,
          order: makeOrder(skill.id),
          phase: 'building',
          called: '',
          misconception: null,
          repairBeat: 0,
          lastAward: null,
          justMastered: null,
          hintUsed: false,
          attemptsThisOrder: 0,
                  justUnlockedHero: null,
          recent: [...recent, skill.id].slice(-6),
        })
      },

      setScreen: (screen) => set({ screen }),
      setPhase: (phase) => set({ phase }),


      /**
       * Sparks buy hints. That is what they are for.
       *
       * Two wrong answers go away and the price comes off the counter, so
       * the cost is something the child watches happen rather than a
       * silently smaller reward they would never notice.
       */
      /** Leave the celebration and go on to the question that follows it. */
      /*
        Kept short: it goes in a speech bubble, and a long one would either
        overflow the cloud or shrink the cheer to nothing.
      */
      setPlayerName: (n: string) => set({ playerName: n.slice(0, 12) }),

      setActiveHero: (id: string) => set({ activeHero: id }),

      finishForge: () => {
        if (get().phase !== 'forged') return
        set({ phase: 'strategy' })
      },

      useHint: () => {
        const { hintUsed, sparks, soundOn } = get()
        if (hintUsed) return
        if (soundOn) S.sToken()
        set({ hintUsed: true, sparks: sparks - hintCharge(sparks) })
      },

      /** The child taps an answer orb; grade it on the hammer's impact. */
      submitChoice: (value) => {
        const { order } = get()
        if (!order) return
        set({ called: String(value), phase: 'striking' })
        window.setTimeout(() => grade(set, get, value), 520)
      },

      submitTemper: (slices, taken) => {
        const { order } = get()
        if (!order) return
        const bug = analyseTemper(order, slices, taken)
        get().setPhase('striking')
        window.setTimeout(() => {
          if (!bug) resolveCorrect(set, get)
          else resolveWrong(set, get, bug)
        }, 420)
      },

      /**
       * A bond is graded on the PAIR the child picked, not on a number
       * they retyped off the screen. Previously the staged orbs were
       * decorative: typing the target with nothing staged was accepted.
       */
      submitBond: (a, b) => {
        const { order } = get()
        if (!order) return
        const actual = a + b
        // Rewrite the sentence to what the child actually built, so a wrong
        // pair is diagnosed and explained in terms of their own choice.
        const claimed: Order = {
          ...order,
          sentence: { a, b, op: '+', answer: actual },
        }
        set({ order: claimed, called: String(order.target), phase: 'striking' })
        window.setTimeout(() => {
          if (actual === order.target) resolveCorrect(set, get)
          else {
            const bug = analyse(claimed, order.target) ?? 'generic.retry'
            resolveWrong(set, get, bug)
          }
        }, 460)
      },

      chooseStrategy: (id) => {
        const { order, states, sparks, badges, soundOn } = get()
        if (!order) { get().nextOrder(); return }
        if (!id) { get().nextOrder(); return }

        const st = states[order.skillId] ?? freshState()
        // Retrieval ("I just knew it") never counts as a novel strategy.
        const isNovel = id !== 'just-knew' && st.strategies.length > 0 && !st.strategies.includes(id)
        const award = isNovel ? SPARKS.novel : SPARKS.named
        const nextBadges = isNovel && !badges.includes('flexible-thinker')
          ? [...badges, 'flexible-thinker'] : badges

        if (soundOn) S.sToken()
        set({
          states: {
            ...states,
            [order.skillId]: {
              ...st,
              strategies: st.strategies.includes(id) ? st.strategies : [...st.strategies, id],
            },
          },
          sparks: sparks + award,
          badges: nextBadges,
          lastAward: {
            sparks: award,
            label: isNovel ? 'A brand new way!' : 'Good thinking!',
          },
        })
        window.setTimeout(() => get().nextOrder(), 900)
      },

      advanceRepair: () => {
        const { repairBeat, soundOn } = get()
        if (soundOn) S.sBeat()
        set({ repairBeat: repairBeat + 1 })
      },

      finishRepair: () => {
        set((s) => ({ sparks: s.sparks + SPARKS.repair }))
        get().nextOrder()
      },

      setGradeFilter: (g) => { set({ gradeFilter: g }); get().nextOrder() },

      /** Fast-forward the forgetting curve. Used by the dashboard demo control. */
      advanceDays: (n) => set((s) => ({ day: s.day + n })),

      toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),

      /**
       * Populate a plausible mid-journey smith: K and Grade 1 solid, Grade 2
       * in progress, a couple of skills deliberately left to decay, and a
       * handful of real misconceptions on record. Used for demos and for
       * seeing the constellation as it looks after a few weeks of play.
       */
      /* ── Open Forge ─────────────────────────────────────────── */

      openStart: (fresh) => {
        const { states, open } = get()
        const ops = unlockedOps(states)
        const target = pickTarget(ops, fresh ? open?.target : undefined)
        set({
          screen: 'open',
          open: {
            target,
            found: [], ways: [], opsUsed: [],
            goal: goalFor(target, ops),
            goalHit: false,
            a: '', b: '', op: ops[0]!, slot: 'a', feedback: null,
          },
        })
      },

      /**
       * A whole number arrives at once now: the child taps a number orb
       * rather than typing digits. 'clear' empties the active box.
       */
      openKey: (k) => {
        const { open, soundOn } = get()
        if (!open) return
        if (k === 'clear') {
          set({ open: { ...open, [open.slot]: '', feedback: null } as OpenSession })
          return
        }
        if (soundOn) S.sPop(open.slot === 'a' ? 0 : 2)
        // Fill the empty box first, so tapping twice fills both in order.
        const slot = open.a === '' ? 'a' : open.b === '' ? 'b' : open.slot
        set({
          open: {
            ...open,
            [slot]: k,
            feedback: null,
            slot: slot === 'a' ? 'b' : 'a',
          } as OpenSession,
        })
      },

      openSetOp: (op) => {
        const { open, soundOn } = get()
        if (!open) return
        if (soundOn) S.sPlace()
        set({ open: { ...open, op, feedback: null } })
      },

      openSetSlot: (slot) => {
        const { open } = get()
        if (open) set({ open: { ...open, slot, feedback: null } })
      },

      openSubmit: () => {
        const { open, sparks, bestWays, soundOn } = get()
        if (!open || open.a === '' || open.b === '') return
        const a = Number(open.a), b = Number(open.b)
        const res = checkWay(a, open.op, b, open.target, open.found)

        if (!res.ok) {
          if (soundOn) S.sNotYet()
          set({
            open: {
              ...open,
              feedback: { kind: res.reason === 'duplicate' ? 'dup' : res.reason!, value: res.value },
            },
          })
          return
        }

        // A way that uses an operation not yet tried on this target is
        // the biggest award here: breadth is the whole point of the mode.
        const isNewOp = !open.opsUsed.includes(open.op)
        const award =
          (open.found.length === 0 ? OPEN_SPARKS.first : OPEN_SPARKS.another) +
          (isNewOp ? OPEN_SPARKS.newOp : 0)

        if (soundOn) { S.sForged(); if (isNewOp) window.setTimeout(S.sToken, 260) }

        const foundNext = [...open.found, res.key!]
        const hitGoalNow = !open.goalHit && foundNext.length >= open.goal
        if (hitGoalNow && soundOn) window.setTimeout(S.sMastery, 420)

        set({
          sparks: sparks + award,
          ingots: get().ingots + (hitGoalNow ? 1 : 0),
          bestWays: Math.max(bestWays, foundNext.length),
          open: {
            ...open,
            found: foundNext,
            ways: [...open.ways, { a, op: open.op, b }],
            opsUsed: isNewOp ? [...open.opsUsed, open.op] : open.opsUsed,
            goalHit: open.goalHit || hitGoalNow,
            a: '', b: '', slot: 'a',
            feedback: { kind: hitGoalNow ? 'goal' : isNewOp ? 'newOp' : 'new' },
          },
        })
      },

      /* ── The Apprentice ─────────────────────────────────────── */

      teachStart: () => {
        const { states, day, teach } = get()
        const skill = pickTeachSkill(states, day, teach?.skillId)
        if (!skill) { set({ screen: 'teach', teach: null }); return }
        const round = buildRound(skill.id)
        if (!round) { set({ screen: 'teach', teach: null }); return }
        set({
          screen: 'teach',
          teach: {
            skillId: skill.id, round, step: 'verdict',
            saidWrong: null, picked: null,
            verdictOk: null, diagnosisOk: null, earned: 0,
          },
        })
      },

      teachVerdict: (saidWrong) => {
        const { teach, sparks, soundOn } = get()
        if (!teach || teach.step !== 'verdict') return
        const ok = saidWrong === !teach.round.pipIsRight
        const earned = ok ? TEACH_SPARKS.spotted : 0
        if (soundOn) ok ? S.sToken() : S.sNotYet()
        set({
          sparks: sparks + earned,
          teach: {
            ...teach, saidWrong, verdictOk: ok, earned: teach.earned + earned,
            // Only go on to "what did Pip do?" when there is something to name.
            step: ok && saidWrong ? 'diagnose' : 'done',
          },
        })
      },

      teachDiagnose: (bugId) => {
        const { teach, sparks, taught, soundOn } = get()
        if (!teach || teach.step !== 'diagnose') return
        const ok = bugId === teach.round.bugId
        const earned = ok ? TEACH_SPARKS.diagnosed : 0
        if (soundOn) ok ? S.sForged() : S.sNotYet()
        set({
          sparks: sparks + earned,
          taught: taught + (ok ? 1 : 0),
          badges: ok && !get().badges.includes('teacher')
            ? [...get().badges, 'teacher'] : get().badges,
          teach: {
            ...teach, picked: bugId, diagnosisOk: ok,
            earned: teach.earned + earned, step: 'done',
          },
        })
      },

      seedDemo: () => {
        const next: Record<string, SkillState> = Object.fromEntries(
          SKILLS.map((s) => [s.id, freshState()]))
        const day = 24
        const learn = (id: string, hits: number, misses = 0, lastSeen = day, strategies: string[] = [], flags: string[] = []) => {
          let pL = freshState().pL
          for (let i = 0; i < hits; i++) pL = updateBKT(pL, true)
          for (let i = 0; i < misses; i++) pL = updateBKT(pL, false)
          next[id] = { pL, attempts: hits + misses, correct: hits, lastSeenDay: lastSeen, strategies, flags }
        }

        // Kindergarten, mastered, and mostly still fresh.
        learn('k.count10', 9, 0, day - 1, ['just-knew'])
        learn('k.bond5', 8, 1, day - 2, ['count-on', 'make-ten'])
        learn('k.add5', 8, 0, day - 2, ['count-on'])
        learn('k.bond10', 10, 1, day - 1, ['make-ten', 'doubles'])
        learn('k.sub5', 7, 1, day - 3, ['count-on'])
        // Left to decay on purpose, this is what fills the review queue.
        learn('k.teen', 8, 0, day - 21, ['break-apart'])

        // Grade 1, solid, with one fading.
        learn('g1.add10', 9, 1, day - 2, ['make-ten', 'doubles'])
        learn('g1.sub10', 8, 2, day - 4, ['count-on'], ['add.count-slip'])
        learn('g1.maketen', 9, 2, day - 1, ['make-ten', 'break-apart'])
        learn('g1.doubles', 9, 0, day - 14, ['doubles', 'known-fact'])
        learn('g1.sub20', 9, 2, day - 17, ['count-on'], ['sub.smaller-from-larger'])
        learn('g1.place2', 7, 1, day - 5, ['break-apart'])

        // Grade 2, actively being learned, with real misconceptions logged.
        learn('g2.add100', 6, 2, day, ['break-apart'])
        learn('g2.carry', 4, 4, day, ['make-ten'], ['add.carry-dropped'])
        learn('g2.sub100', 5, 2, day - 1, ['break-apart'])
        learn('g2.borrow', 2, 5, day, [], ['sub.smaller-from-larger', 'sub.borrow-dropped'])
        learn('g2.skip', 6, 1, day - 2, ['skip-count'])
        learn('g2.arrays', 4, 2, day - 1, ['skip-count'])

        // Grade 3, just opening up.
        learn('g3.mult5', 3, 2, day, ['skip-count'], ['mult.added-instead'])

        // A jar mid-collection: some caught, some still loose, most unmet.

        set({
          states: next,
          day,
          sparks: 1840,
          ingots: 12,
          totalForges: 161,
          bestStreak: 19,
          badges: ['flexible-thinker'],
          screen: 'constellation',
          streak: 0,
        })
      },

      resetAll: () => set({
        states: initialStates(), sparks: 0, ingots: 0, day: 0, badges: [], playerName: '',
        bestWays: 0, taught: 0, open: null, teach: null, hintUsed: false, attemptsThisOrder: 0,
        activeHero: STARTER_HERO, justUnlockedHero: null,
        warmup: [], warmupTotal: 0, inWarmup: false,
        totalForges: 0, bestStreak: 0, streak: 0, screen: 'title',
        order: null, recent: [], called: '', misconception: null,
        // A reset means a brand-new smith, so the chosen band goes too.
        gradeFilter: null, phase: 'building', repairBeat: 0,
        lastAward: null, justMastered: null,
      }),
    }),
    {
      name: 'numbersmith.save.v1',
      /*
        Saves written before the creature collection was removed still
        carry its keys. Nothing reads them, but leaving them means every
        existing save quietly hauls around a feature that no longer
        exists. Dropped here rather than by bumping the save name, which
        would throw away the child's progress along with them.
      */
      migrate: (saved) => {
        if (!saved || typeof saved !== 'object') return saved
        const { bugs, justCaughtBug, justSpawnedBug, ...rest } = saved as Record<string, unknown>
        return rest
      },
      partialize: (s) => ({
        states: s.states, sparks: s.sparks, ingots: s.ingots, day: s.day,
        bestWays: s.bestWays, taught: s.taught,
        badges: s.badges, totalForges: s.totalForges, bestStreak: s.bestStreak,
        gradeFilter: s.gradeFilter, soundOn: s.soundOn, playerName: s.playerName,
        activeHero: s.activeHero,
      }),
    }))

if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).__game = useGame
  ;(window as unknown as Record<string, unknown>).__audio = S
}

/* ── grading pipeline ────────────────────────────────────────── */

type Set_ = (partial: Partial<Game> | ((s: Game) => Partial<Game>)) => void
type Get_ = () => Game

function grade(set: Set_, get: Get_, given: number) {
  const { order } = get()
  if (!order) return
  const bug = analyse(order, given)
  if (!bug) resolveCorrect(set, get)
  else resolveWrong(set, get, bug)
}

function resolveCorrect(set: Set_, get: Get_) {
  const { order, states, day, sparks, streak, bestStreak, totalForges, ingots, soundOn, attemptsThisOrder, hintUsed } = get()
  if (!order) return

  /*
    Two different questions, deliberately kept apart.

    firstTry is about the REWARD: was this answered outright, or reached
    after missing it. A hint does not enter into it, because the child
    already paid for that in stars and should not be charged twice.

    unaided is about the LEARNING SIGNAL: did the child do this on their
    own. Mastery, the accuracy figure, the streak and the bug hunt all
    mean "can do this unaided", so a hint disqualifies them just as a miss
    does. Being handed half the answer is not evidence of knowing it, and
    scoring it as though it were would overstate every child who leans on
    the hint button.
  */
  const firstTry = attemptsThisOrder === 0
  const unaided = firstTry && !hintUsed

  /*
    A hero joins on unaided work only: a run of clean answers, medals,
    or creatures caught. All three are already impossible to grind, so
    the roster cannot be farmed by tapping through easy questions.
  */
  const heroesBefore = unlockedHeroes(bestStreak, ingots).length

  const prev = states[order.skillId] ?? freshState()
  const before = currentMastery(prev, day)
  const next: SkillState = {
    ...prev,
    // The opportunity was already scored on the first attempt; a later
    // success on the same question, or one reached with a hint, earns
    // only the reduced transfer.
    pL: unaided ? updateBKT(before, true) : relearnBKT(before),
    attempts: prev.attempts + 1,
    correct: prev.correct + (unaided ? 1 : 0),
    lastSeenDay: day,
  }
  const crossedMastery = before < MASTERY_THRESHOLD && next.pL >= MASTERY_THRESHOLD
  const newStreak = unaided ? streak + 1 : 0

  if (soundOn) { S.sForged(); if (crossedMastery) window.setTimeout(S.sMastery, 420) }

  set({
    states: { ...states, [order.skillId]: next },
    // The reward follows the same rule as the mastery: a clean answer
    // pays the forge, an answer reached after a miss pays the repair.
    sparks: sparks + (firstTry ? SPARKS.forge : SPARKS.repair),
    ingots: ingots + (crossedMastery ? 1 : 0),
    streak: newStreak,
    bestStreak: Math.max(bestStreak, newStreak),
    totalForges: totalForges + 1,
    phase: 'forged',
    justMastered: crossedMastery ? order.skillId : null,
    celebrate: get().celebrate + 1,
    attemptsThisOrder: attemptsThisOrder + 1,
    justUnlockedHero: (() => {
      const after = unlockedHeroes(
        Math.max(bestStreak, newStreak),
        ingots + (crossedMastery ? 1 : 0),
      )
      return after.length > heroesBefore ? after[after.length - 1]!.id : null
    })(),
    lastAward: firstTry
      ? { sparks: SPARKS.forge, label: 'You did it!' }
      : { sparks: SPARKS.repair, label: 'You fixed it!' },
  })

  /*
    No timer here on purpose. The celebration used to time out while the
    child was still reading it, so it now waits for them to tap Next task.
  */
}

function resolveWrong(set: Set_, get: Get_, bug: string) {
  const { order, states, day, soundOn } = get()
  if (!order) return

  const prev = states[order.skillId] ?? freshState()
  const firstTry = get().attemptsThisOrder === 0
  const next: SkillState = {
    ...prev,
    // One miss per question. Guessing through the orbs used to hammer
    // mastery down again on every tap, which punished a child for
    // exploring far harder than getting it wrong once deserves.
    pL: firstTry ? updateBKT(currentMastery(prev, day), false) : prev.pL,
    attempts: prev.attempts + 1,
    lastSeenDay: day,
    flags: prev.flags.includes(bug) ? prev.flags : [...prev.flags, bug],
  }

  if (soundOn) S.sNotYet()
  set({
    states: { ...states, [order.skillId]: next },
    streak: 0,
    misconception: bug,
    phase: 'repair',
    repairBeat: 0,
    attemptsThisOrder: get().attemptsThisOrder + 1,
  })
}

/* ── selectors ───────────────────────────────────────────────── */

export const useSummary = () => {
  const states = useGame((s) => s.states)
  const day = useGame((s) => s.day)
  return summarise(states, day)
}

export const useSkillStatus = (id: string) => {
  const states = useGame((s) => s.states)
  const day = useGame((s) => s.day)
  const skill = SKILL_BY_ID[id]
  return skill ? statusOf(skill, states, day) : 'locked'
}

export { SKILLS, SKILL_BY_ID, currentMastery, statusOf }

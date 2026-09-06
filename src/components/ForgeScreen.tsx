import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { useGame, SKILL_BY_ID } from '../state/store'
import { VERB_META } from '../engine/orders'
import { GRADE_LABEL } from '../engine/skills'
import { HINT_COST } from '../engine/strategies'
import { currentMastery, freshState } from '../engine/mastery'
import { AnswerChoice } from './AnswerChoice'
import { Sparks, AwardFloat } from './Sparks'
import { Hero } from './Hero'
import { HeroArt } from './HeroArt'
import { HERO_BY_ID } from '../engine/heroes'
import { Icon, VERB_ICON } from './Icon'
import { Button, Kicker, Meter, Chip } from './ui'
import { FuseStage } from './stages/FuseStage'
import { CleaveStage } from './stages/CleaveStage'
import { StampStage } from './stages/StampStage'
import { ShareStage } from './stages/ShareStage'
import { TemperStage } from './stages/TemperStage'

const VERB_BG: Record<string, string> = {
  fuse: 'bg-marigold', cleave: 'bg-leaf', stamp: 'bg-plum text-cream',
  share: 'bg-sky', temper: 'bg-berry text-cream',
}

export function ForgeScreen() {
  const order = useGame((s) => s.order)
  const phase = useGame((s) => s.phase)
  const states = useGame((s) => s.states)
  const day = useGame((s) => s.day)
  const celebrate = useGame((s) => s.celebrate)
  const lastAward = useGame((s) => s.lastAward)
  const justMastered = useGame((s) => s.justMastered)
  const hintUsed = useGame((s) => s.hintUsed)
  const sparks = useGame((s) => s.sparks)
  const useHint = useGame((s) => s.useHint)
  const finishForge = useGame((s) => s.finishForge)
  const playerName = useGame((s) => s.playerName)
  const activeHero = useGame((s) => s.activeHero)
  const justUnlockedHero = useGame((s) => s.justUnlockedHero)
  const inWarmup = useGame((s) => s.inWarmup)
  const warmup = useGame((s) => s.warmup)
  const warmupTotal = useGame((s) => s.warmupTotal)


  if (!order) return null

  const skill = SKILL_BY_ID[order.skillId]!
  const meta = VERB_META[order.verb]
  const mastery = currentMastery(states[order.skillId] ?? freshState(), day)
  const locked = phase !== 'building' && phase !== 'calling'
  const forged = phase === 'forged'


  /* Which orders are answered by typing, and only once they are ready. */
  const typedAnswer =
    order.verb !== 'temper' && !(order.verb === 'fuse' && order.mode === 'bond')
  const needsChoice =
    typedAnswer && (phase === 'calling' || phase === 'striking' || phase === 'forged')
  /*
    Who can ask for help. Orders with answer orbs offer the hint once
    there is something to answer; bond orders offer it while the child is
    still building, because that is when they are stuck. Gating help on
    the answer orbs alone left four of the six Kindergarten skills with no
    hint at all.
  */
  const canHint =
    needsChoice || (order.verb === 'fuse' && order.mode === 'bond' && phase === 'building')

  const Stage =
    order.verb === 'fuse' ? FuseStage
    : order.verb === 'cleave' ? CleaveStage
    : order.verb === 'stamp' ? StampStage
    : order.verb === 'share' ? ShareStage
    : TemperStage

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {/*
        The warm-up banner. The forgetting curve has always driven what the
        game offers next; this is the first place it says so out loud.
      */}
      {inWarmup && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex shrink-0 justify-center px-3 pt-2 sm:px-5 sm:pt-3"
        >
          <div className="ink hard-1 flex items-center gap-2.5 rounded-full bg-plum px-4 py-1.5 text-cream">
            <Icon name="clock" size={16} strokeWidth={2.8} />
            {/* Warm, not accusing: the child is being reminded, not told
                off for forgetting. */}
            <span className="font-display text-sm font-black">
              Warm up! Let's remember this one
            </span>
            {warmupTotal > 1 && (
              <span className="rounded-full bg-cream/25 px-2 py-0.5 font-display text-xs font-black">
                {warmupTotal - warmup.length} of {warmupTotal}
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* order card */}
      <div className="grid shrink-0 justify-center px-3 pb-1.5 pt-1.5 sm:px-5 sm:pb-3 sm:pt-4">
        {/* keyed, not presence-wrapped, for the same reason as the stage */}
        <motion.div
            key={order.id}
            style={{ gridColumn: 1, gridRow: 1 }}
            initial={{ y: -30, opacity: 0, rotate: -3 }}
            animate={{ y: 0, opacity: 1, rotate: -0.8 }}
            transition={{ type: 'spring', stiffness: 340, damping: 24 }}
            className="ink-thick hard-3 flex max-w-full items-center gap-3 rounded-blob bg-card px-4 py-2.5 sm:gap-4 sm:px-6 sm:py-3.5"
          >
            <div className={`ink grid h-13 w-13 shrink-0 place-items-center rounded-2xl p-2.5 ${VERB_BG[order.verb]}`}>
              <Icon name={VERB_ICON[order.verb]!} size={26} strokeWidth={2.6} />
            </div>
            <div className="min-w-0">
              <Kicker>{meta.name} · {GRADE_LABEL[skill.grade]} · {skill.label}</Kicker>
              <div className="mt-1 font-display text-xl font-black leading-tight tracking-tight sm:text-2xl">
                {order.prompt}
              </div>
            </div>
            <div className="ml-4 shrink-0 text-right">
              <Kicker className="mb-1.5">how well</Kicker>
              <Meter value={mastery} className="w-20" height={10} />
            </div>
          </motion.div>
      </div>

      {/* stage */}
      {/*
        The stage grows to fill a tall window, but never collapses below the
        height its contents actually need. On a very short screen (an iPhone
        SE is only 667px tall) that pushes the column past the viewport and
        the screen scrolls, which is far better than clipping the ore tray
        away entirely and leaving the child nothing to tap.
      */}
      {/*
        The band above the stage: Captain Number on the left, Hint on the
        right. Both used to be absolutely positioned inside the stage box,
        where neither could tell how tall that stage was, so both ended up
        sitting on the puzzle. In the flow the layout keeps them clear.
      */}
      <div className="flex shrink-0 items-end justify-between gap-2 px-3 sm:px-6">
        <AnimatePresence>
          {forged && (
            <motion.div
              key="hero"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 28 }}
              /*
                Clip sideways only. He starts a full viewport off to the
                right, which would otherwise widen the page and pop up a
                horizontal scrollbar mid-flight; clipping the other axis
                too would lop his head off as he banks.
              */
              className="min-w-0 overflow-x-clip"
            >
              <Hero show={forged} seed={celebrate} name={playerName} heroId={activeHero} />
            </motion.div>
          )}
        </AnimatePresence>

        {/*
          What to do, in the gap between the two. It used to have a row of
          its own above this one, which stood there empty and 32px tall for
          every phase but the first: a band of nothing across the screen
          exactly when the screen had least room to spare.
        */}
        <div className="flex min-h-6 flex-1 items-end justify-center pb-2 sm:min-h-8">
          <AnimatePresence mode="wait">
            {phase === 'building' && (
              <motion.div
                key={`${order.id}-hint`}
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              >
                <Kicker className="text-center">
                  {order.verb === 'fuse' && order.mode === 'bond'
                    ? `Pick two numbers that make ${order.target}`
                    : order.layers
                      ? 'Build up the layers, then count all the cubes'
                      : order.verb === 'temper'
                        ? meta.blurb
                        : `${meta.blurb}, then guess what it makes`}
                </Kicker>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/*
          Help sits beside the puzzle, not buried in a menu. A stuck child
          should always be able to see a way forward that is not guessing,
          and taking it costs stars rather than pride. The price is on the
          button so spending is a choice the child makes with their eyes
          open, not a smaller reward they never notice arriving.
        */}
        <div className="shrink-0 pb-2">
          <AnimatePresence>
            {canHint && (
              <motion.div
                key="hint"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Button
                  size="sm" icon="bulb"
                  color={hintUsed ? 'card' : 'marigold'}
                  disabled={hintUsed}
                  onClick={useHint}
                >
                  {hintUsed ? 'Hint used' : 'Hint'}
                  {!hintUsed && (
                    <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full
                                     bg-ink/15 px-1.5 py-0.5 text-[11px] font-black">
                      <Icon name="star" size={10} /> {HINT_COST}
                    </span>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="relative grid min-h-[228px] shrink-0 grow basis-auto place-items-center px-4 sm:min-h-[260px]">
        {/*
          No AnimatePresence around the stage, on purpose.

          Both ways of using it broke here, in opposite directions. With
          mode="wait" the incoming puzzle waits for the outgoing one to
          finish animating away, so a stalled exit leaves a question with
          no puzzle under it. Without it, every exiting stage stays mounted
          until its animation completes, and stalled exits pile up: seven
          live stages stacked in one grid cell, the top one silently eating
          every click meant for the BANG button underneath.

          A plain keyed element has neither failure. React swaps it the
          moment the key changes, so there is always exactly one stage, and
          the entry animation still plays.
        */}
        <motion.div
          key={order.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.24 }}
          className="col-start-1 row-start-1 grid w-full place-items-center"
        >
          <Stage order={order} locked={locked} />
        </motion.div>


        <Sparks trigger={forged ? celebrate : 0} />
        {lastAward && forged && <AwardFloat amount={lastAward.sparks} label={lastAward.label} />}

        <AnimatePresence>
          {/* a new hero joining is the biggest thing that can happen, so
              it takes the stage ahead of a bug or a star */}
          {justUnlockedHero && HERO_BY_ID[justUnlockedHero] && (
            <motion.div
              key="hero-unlock"
              initial={{ y: 70, opacity: 0, scale: 0.6 }}
              animate={{ y: 0, opacity: 1, scale: 1, rotate: -1.5 }}
              exit={{ y: -24, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 16 }}
              className="ink-thick hard-4 absolute bottom-4 z-45 flex items-center gap-4 rounded-blob bg-marigold px-7 py-3.5"
            >
              <HeroArt hero={HERO_BY_ID[justUnlockedHero]!} landed size={52} />
              <div>
                <Kicker>A new hero joined you!</Kicker>
                <div className="font-display text-lg font-black leading-tight">
                  {HERO_BY_ID[justUnlockedHero]!.name} is here!
                </div>
              </div>
            </motion.div>
          )}
          {justMastered && !justUnlockedHero && (
            <motion.div
              initial={{ y: 60, opacity: 0, rotate: 6 }}
              animate={{ y: 0, opacity: 1, rotate: -1.5 }}
              exit={{ y: -24, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="ink-thick hard-4 absolute bottom-4 z-45 flex items-center gap-4 rounded-blob bg-marigold px-7 py-3.5"
            >
              <Icon name="star" size={32} />
              <div>
                <Kicker>New star · +1 medal</Kicker>
                <div className="font-display text-lg font-black leading-tight">
                  You've got {SKILL_BY_ID[justMastered]?.label}!
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/*
        Next task sits in the layout flow between the stage and the answers,
        not floating over them. As an overlay it had no way of knowing how
        tall the stage was and kept landing on the puzzle.
      */}
      <AnimatePresence>
        {forged && (
          <motion.div
            key="nexttask"
            initial={{ height: 0, opacity: 0, y: -8 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="flex shrink-0 justify-center overflow-hidden"
          >
            <div className="py-3">
              <Button color="teal" size="lg" icon="forward" onClick={finishForge}>
                Next task
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* call pad */}
      {/*
        The answer orbs appear only once there is something to answer.
        Bond and slice orders are answered by what you build, and the other
        verbs have nothing to choose until the structure is set.
      */}
      <AnimatePresence>
        {needsChoice && (
          <motion.div
            key="answers"
            initial={{ height: 0, opacity: 0, y: 16 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex shrink-0 justify-center overflow-hidden px-3 sm:px-5"
          >
            <div className="pb-2.5 pt-1 sm:pb-5 sm:pt-2">
              <AnswerChoice disabled={locked} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

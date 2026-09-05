import { motion } from 'framer-motion'
import { useEffect, useMemo } from 'react'
import { useGame } from '../state/store'
import { misconceptionOf } from '../engine/misconceptions'
import { RepairVisual } from './RepairVisuals'
import * as S from '../audio/sound'
import { Icon } from './Icon'
import { Button, Chip, Kicker } from './ui'

/**
 * The Misconception Radar, made visible.
 *
 * A wrong answer never produces a red cross, it produces a diagnosis
 * and a short guided repair built from the verbs the child already
 * knows. Effort is paid whether or not the first attempt landed.
 */
export function RepairScene() {
  const order = useGame((s) => s.order)
  const mid = useGame((s) => s.misconception)
  const beatIdx = useGame((s) => s.repairBeat)
  const advance = useGame((s) => s.advanceRepair)
  const finish = useGame((s) => s.finishRepair)
  const called = useGame((s) => s.called)
  const soundOn = useGame((s) => s.soundOn)

  const mc = misconceptionOf(mid ?? undefined)
  const beats = useMemo(
    () => (mc && order ? mc.repair(order, Number(called) || 0) : []),
    [mc, order, called])
  const beat = beats[Math.min(beatIdx, beats.length - 1)]
  const last = beatIdx >= beats.length - 1

  if (!mc || !order || !beat) return null

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-100 grid place-items-center bg-ink/45 p-5 backdrop-blur-[3px]"
    >
      <motion.div
        initial={{ scale: 0.88, y: 30, rotate: 2 }}
        animate={{ scale: 1, y: 0, rotate: -0.5 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        className="ink-thick hard-4 flex w-[min(780px,100%)] flex-col gap-4 rounded-blob bg-paper p-7"
      >
        <div className="flex items-center gap-3.5">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="ink hard-1 grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-teal"
          >
            <Icon name="radar" size={24} strokeWidth={2.6} />
          </motion.div>
          <div className="min-w-0">
            <Kicker>Let's look together</Kicker>
            <div className="font-display text-lg font-black leading-tight">
              Not yet! Here is why
            </div>
          </div>
          <Chip className="ml-auto" color="marigold">you said {called}</Chip>
        </div>


        {/* the warm line, never "wrong", always "not yet" */}
        <div className="ink hard-1 rounded-2xl bg-teal px-4 py-3 font-display text-base font-extrabold">
          {mc.kidLine}
        </div>

        <div className="ink grid place-items-center rounded-blob bg-card px-4 py-5">
          {/*
            Keyed, not presence-wrapped. AnimatePresence around content
            that swaps by key fails both ways: mode="wait" leaves the panel
            empty if an exit stalls, and without it the stalled beats stay
            mounted and stack. React swaps a keyed element outright.
          */}
          <motion.div
            key={beatIdx}
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.24 }}
            className="grid w-full place-items-center"
          >
            <RepairVisual beat={beat} />
          </motion.div>
        </div>

        <motion.p
            key={beatIdx}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="min-h-13 text-center text-lg leading-snug text-ink-mid"
          >
            {beat.text}
          </motion.p>

        <div className="flex items-center gap-3.5">
          <div className="flex gap-1.5">
            {beats.map((_, i) => (
              <div
                key={i}
                className={`h-2.5 rounded-full border-2 border-ink transition-all
                            ${i <= beatIdx ? 'bg-tomato' : 'bg-card'} ${i === beatIdx ? 'w-7' : 'w-2.5'}`}
              />
            ))}
          </div>
          <Button
            className="ml-auto" color="tomato" icon={last ? 'check' : 'forward'}
            onClick={() => { if (last) { if (soundOn) S.sToken(); finish() } else advance() }}
          >
            {last ? "Got it! Let's play" : 'Next'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

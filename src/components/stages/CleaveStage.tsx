import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Anvil } from './Anvil'
import { IconButton, Kicker } from '../ui'
import { Coach } from '../Coach'
import { useGame } from '../../state/store'
import * as S from '../../audio/sound'
import type { Order } from '../../engine/types'

/** CLEAVE, subtraction as physically splitting a bar. */
export function CleaveStage({ order, locked }: { order: Order; locked: boolean }) {
  const source = order.source ?? 10
  const keep = order.sentence.b
  const soundOn = useGame((s) => s.soundOn)
  const setPhase = useGame((s) => s.setPhase)
  const phase = useGame((s) => s.phase)

  /* Coarse steps on big bars, or the target is unhittable. */
  const { step, min, max } = useMemo(() => {
    const coarse = source >= 60 && keep % 10 === 0
    const st = coarse ? 10 : 1
    return { step: st, min: st, max: Math.floor((source - 1) / st) * st }
  }, [source, keep])

  const [cut, setCut] = useState(() => clampTo(Math.round(source / 2), min, max, step))
  useEffect(() => { setCut(clampTo(Math.round(source / 2), min, max, step)) }, [order.id, source, min, max, step])

  const set = cut === keep

  useEffect(() => {
    if (set && phase === 'building') { if (soundOn) S.sCleave(); setPhase('calling') }
    if (!set && phase === 'calling') setPhase('building')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set, phase])

  /** Magnetic snap so small hands can still land the target. */
  const applyCut = (raw: number) => {
    const tol = Math.max(step, Math.round(source * 0.02))
    const next = Math.abs(raw - keep) <= tol ? keep : raw
    if (next !== cut && soundOn) S.sPop(Math.abs(next - cut) > 1 ? 2 : 0)
    setCut(next)
  }
  const nudge = (d: number) => applyCut(Math.min(max, Math.max(min, cut + d)))
  const showPips = source <= 24

  return (
    <Anvil hot={set}>
      <div className="w-full max-w-[620px]">
        {/* flex partition, the two pieces always meet exactly */}
        <div className="ink-thick hard-2 flex h-24 overflow-hidden rounded-blob bg-card">
          <motion.div
            animate={{ flexGrow: cut }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className={`relative grid basis-0 place-items-center border-r-4 border-ink
                        ${set ? 'bg-leaf' : 'bg-shade'}`}
          >
            <span className="font-display text-3xl font-black text-ink">{cut}</span>
            {showPips && <Pips n={cut} />}
          </motion.div>
          <motion.div
            animate={{ flexGrow: source - cut }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="relative grid basis-0 place-items-center bg-tomato"
          >
            <span className="font-display text-3xl font-black text-cream/70">?</span>
            {showPips && <Pips n={source - cut} light />}
          </motion.div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <IconButton name="minus" title="Move the cut left" onClick={() => nudge(-step)} />
          <input
            type="range" min={min} max={max} step={step} value={cut} disabled={locked}
            onChange={(e) => applyCut(Number(e.target.value))}
            aria-label="Set the cleave point"
            className="h-7 flex-1 cursor-grab"
            style={{ accentColor: set ? 'var(--color-leaf)' : 'var(--color-tomato)' }}
          />
          <IconButton name="plus" title="Move the cut right" onClick={() => nudge(step)} />
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <Kicker>Whole bar: {source}</Kicker>
          {set
            ? <Coach text="Now guess the other piece" dir="down" tone="teal" />
            : /* Not "the green piece": it is not green yet. Green is how the
                 bar confirms a match, so naming the colour in the
                 instruction described the finished state as though it were
                 the current one. The number is the thing that changes as
                 the child slides, so point at that instead. */
              <Coach text={`Slide until it says ${keep}`} dir="up" tone="marigold" />}
        </div>
      </div>
    </Anvil>
  )
}

function Pips({ n, light }: { n: number; light?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex">
      {Array.from({ length: Math.max(n, 0) }).map((_, i) => (
        <div
          key={i}
          className="flex-1"
          style={{ borderRight: i < n - 1 ? `2px solid ${light ? 'rgba(255,243,220,0.35)' : 'rgba(35,24,15,0.18)'}` : 'none' }}
        />
      ))}
    </div>
  )
}

function clampTo(v: number, min: number, max: number, step: number) {
  return Math.min(max, Math.max(min, Math.round(v / step) * step))
}

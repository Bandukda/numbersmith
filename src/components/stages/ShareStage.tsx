import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { Anvil } from './Anvil'
import { Kicker } from '../ui'
import { Coach } from '../Coach'
import { useGame } from '../../state/store'
import type { Order } from '../../engine/types'

/** SHARE, division as dealing a pile into equal crucibles. */
export function ShareStage({ order, locked }: { order: Order; locked: boolean }) {
  const total = order.source ?? 12
  const groups = order.groups ?? 3
  const setPhase = useGame((s) => s.setPhase)
  const phase = useGame((s) => s.phase)

  useEffect(() => { if (phase === 'building') setPhase('calling') }, [order.id, phase, setPhase])

  const shown = Math.min(total, 40)

  /*
    Most share orders divide exactly. The Grade 4 "Leftovers" skill does
    not, by design, and the leftovers were never drawn: the child saw
    buckets that plainly could not be filled equally and nothing to
    explain it. Show them on the bench instead.
  */
  const leftover = total % groups

  return (
    <Anvil hot={!locked}>
      <div className="flex w-full flex-col items-center gap-2 sm:gap-4">
        <Kicker>The pile: {total}</Kicker>
        <div className="flex max-w-[430px] flex-wrap justify-center gap-1.5">
          {Array.from({ length: shown }).map((_, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: i * 0.012, type: 'spring', stiffness: 520, damping: 22 }}
              className="ink h-3 w-3 rounded-full bg-marigold sm:h-4 sm:w-4"
              style={{ borderWidth: 2 }}
            />
          ))}
          {total > shown && <span className="font-display text-sm font-black">+{total - shown}</span>}
        </div>

        <div className="flex flex-wrap items-end justify-center gap-3">
          {Array.from({ length: groups }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: 26, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.18 + i * 0.06, type: 'spring', stiffness: 380, damping: 22 }}
              className="ink-thick hard-2 grid h-11 w-12 place-items-center rounded-b-blob rounded-t-lg bg-card sm:h-14 sm:w-16"
            >
              <span className="font-display text-2xl font-black text-ink-dim">?</span>
            </motion.div>
          ))}
        </div>
        {leftover > 0 && (
          <div className="ink hard-1 flex items-center gap-2 rounded-2xl bg-shade px-3 py-1.5">
            <span className="font-display text-xs font-extrabold uppercase tracking-widest text-ink-mid">
              left on the bench
            </span>
            <span className="flex gap-1">
              {Array.from({ length: leftover }).map((_, i) => (
                <span key={i} className="ink h-3 w-3 rounded-full bg-tomato" style={{ borderWidth: 2 }} />
              ))}
            </span>
          </div>
        )}
        <Coach
          text={leftover > 0
            ? `Guess how many go in each group. ${leftover} will not fit!`
            : `Guess how many go in each of the ${groups} groups`}
          dir="down" tone="teal"
        />
      </div>
    </Anvil>
  )
}

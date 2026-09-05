import { motion } from 'framer-motion'
import { useEffect, useMemo } from 'react'
import { useGame } from '../state/store'
import { strategiesFor, SPARKS } from '../engine/strategies'
import { Icon } from './Icon'
import { Button, Kicker } from './ui'

const GLYPH_ICON = ['target', 'fuse', 'stamp', 'bulb', 'share', 'star', 'flame'] as const
const CARD_BG = ['bg-marigold', 'bg-teal', 'bg-sky', 'bg-leaf']

/**
 * Strategy Tokens, the anti-timer.
 * There is no clock in this game. Naming your method pays more than
 * speed ever could, and a method new to this skill pays the most.
 */
export function StrategyPicker() {
  const order = useGame((s) => s.order)
  const states = useGame((s) => s.states)
  const choose = useGame((s) => s.chooseStrategy)

  const options = useMemo(() => (order ? strategiesFor(order) : []), [order])
  const known = order ? (states[order.skillId]?.strategies ?? []) : []

  if (!order) return null

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-95 grid place-items-center bg-ink/45 p-5 backdrop-blur-[3px]"
    >
      <motion.div
        initial={{ scale: 0.9, y: 26, rotate: -2 }}
        animate={{ scale: 1, y: 0, rotate: 0.5 }}
        transition={{ type: 'spring', stiffness: 330, damping: 24 }}
        className="ink-thick hard-4 flex w-[min(660px,100%)] flex-col gap-5 rounded-blob bg-paper p-7"
      >
        <div className="text-center">
          <Kicker>Nice one!</Kicker>
          <h2 className="mt-1.5 font-display text-3xl font-black tracking-tight">How did you figure it out?</h2>
          <p className="mt-2 text-sm text-ink-mid">
            There is no clock! Telling us how you thought is worth MORE than being fast.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {options.map((s, i) => {
            const isNew = s.id !== 'just-knew' && known.length > 0 && !known.includes(s.id)
            return (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, type: 'spring', stiffness: 400, damping: 24 }}
                whileHover={{ y: -4, rotate: i % 2 ? 1 : -1 }}
                onClick={() => choose(s.id)}
                className={`ink-thick hard-3 pressable relative flex flex-col items-center gap-2.5
                            rounded-blob px-4 py-5 ${CARD_BG[i % CARD_BG.length]}`}
              >
                {isNew && (
                  <span className="ink absolute -right-2 -top-2.5 rounded-full bg-tomato px-2 py-0.5
                                   font-display text-[10px] font-black tracking-wide text-cream">
                    NEW +{SPARKS.novel}
                  </span>
                )}
                <Icon name={GLYPH_ICON[i % GLYPH_ICON.length]!} size={30} strokeWidth={2.6} />
                <span className="text-center font-display text-base font-black leading-tight">{s.label}</span>
                {known.includes(s.id) && <Kicker>done before</Kicker>}
              </motion.button>
            )
          })}
        </div>

        <Button className="self-center" size="sm" onClick={() => choose(null)}>Skip</Button>
      </motion.div>
    </motion.div>
  )
}

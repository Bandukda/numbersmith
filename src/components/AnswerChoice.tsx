import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useGame } from '../state/store'
import { answerChoices } from '../engine/choices'
import { fmt } from '../engine/format'
import { Orb, toneFor } from './Orb'
import { Coach } from './Coach'
import { useViewportWidth } from '../hooks/useViewport'
import * as S from '../audio/sound'

/**
 * Tap the answer. No typing anywhere in the game.
 *
 * The three wrong orbs are generated from the misconception taxonomy, so
 * choosing one is exactly as diagnostic as typing it used to be.
 */
export function AnswerChoice({ disabled }: { disabled?: boolean }) {
  const order = useGame((s) => s.order)
  const submitChoice = useGame((s) => s.submitChoice)
  const soundOn = useGame((s) => s.soundOn)
  const narrow = useViewportWidth() < 560
  const [chosen, setChosen] = useState<number | null>(null)

  const hintUsed = useGame((s) => s.hintUsed)
  const all = useMemo(() => (order ? answerChoices(order) : []), [order?.id])

  /* A hint clears away two wrong orbs, leaving a straight choice of two. */
  const options = useMemo(() => {
    if (!hintUsed || !order) return all
    const right = order.sentence.answer
    const firstWrong = all.find((v) => v !== right)
    return all.filter((v) => v === right || v === firstWrong)
  }, [all, hintUsed, order?.id])
  useEffect(() => { setChosen(null) }, [order?.id])

  if (!order) return null

  const pick = (v: number) => {
    if (disabled || chosen !== null) return
    if (soundOn) S.sStrike()
    setChosen(v)
    submitChoice(v)
  }

  return (
    <div className={`flex flex-col items-center gap-2.5 transition-opacity duration-200
                     ${disabled ? 'pointer-events-none opacity-40' : ''}`}>
      <Coach text="Tap your answer" dir="down" tone="tomato" />
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
        {options.map((v, i) => (
          <motion.div
            key={`${order.id}-${v}`}
            initial={{ opacity: 0, y: 18, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: chosen === v ? 1.12 : 1 }}
            transition={{ delay: i * 0.05, type: 'spring', stiffness: 420, damping: 24 }}
          >
            <Orb
              value={fmt(v, order.scale)}
              size={narrow ? 62 : 76}
              tone={toneFor(v)}
              grab={!disabled && chosen === null}
              selected={chosen === v}
              onClick={() => pick(v)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

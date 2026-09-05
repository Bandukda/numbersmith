import { motion } from 'framer-motion'
import { useMemo } from 'react'

const CONFETTI = ['#FF5C39', '#FFB627', '#2EC4B6', '#7B2CBF', '#58B368', '#E8336D']

/**
 * A burst of paper confetti. Chunky ink-outlined shapes rather than
 * glowing particles, glow belongs to the aesthetic we just left.
 */
export function Sparks({ trigger, count = 22 }: { trigger: number; count?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6
        const dist = 120 + Math.random() * 170
        return {
          id: `${trigger}-${i}`,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist - 40,
          size: 10 + Math.random() * 12,
          rot: Math.random() * 620 - 310,
          square: i % 3 === 0,
          color: CONFETTI[i % CONFETTI.length]!,
          delay: Math.random() * 0.1,
          dur: 0.75 + Math.random() * 0.5,
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trigger, count])

  if (!trigger) return null

  return (
    <div className="absolute inset-0 grid place-items-center pointer-events-none z-40">
      {bits.map((b) => (
        <motion.span
          key={b.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }}
          animate={{ x: b.x, y: b.y, opacity: 0, scale: 1, rotate: b.rot }}
          transition={{ duration: b.dur, delay: b.delay, ease: [0.16, 1, 0.3, 1] }}
          className="absolute"
          style={{
            width: b.size, height: b.size, background: b.color,
            border: '2.5px solid var(--color-ink)',
            borderRadius: b.square ? 3 : '50%',
          }}
        />
      ))}
    </div>
  )
}

/** The "+12" that leaps off a successful forge. */
export function AwardFloat({ amount, label }: { amount: number; label: string }) {
  return (
    <motion.div
      initial={{ y: 10, opacity: 0, scale: 0.6 }}
      animate={{ y: -74, opacity: [0, 1, 1, 0], scale: 1 }}
      transition={{ duration: 1.5, times: [0, 0.16, 0.72, 1], ease: 'easeOut' }}
      className="absolute left-1/2 top-[36%] -translate-x-1/2 text-center pointer-events-none z-50"
    >
      <div className="ink-thick hard-3 rounded-full bg-marigold px-5 py-2">
        <span className="font-display font-black text-4xl text-ink">+{amount}</span>
      </div>
      <div className="mt-2 font-display font-extrabold text-sm text-ink">{label}</div>
    </motion.div>
  )
}

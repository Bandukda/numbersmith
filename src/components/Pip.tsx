import { motion } from 'framer-motion'

export type PipMood = 'thinking' | 'happy' | 'sheepish' | 'proud'

/**
 * Pip, the apprentice.
 *
 * Deliberately drawn as a smaller, rounder, friendlier thing than the
 * bugs: the child is meant to want to help Pip, not catch them.
 */
export function Pip({ mood = 'thinking', size = 110 }: { mood?: PipMood; size?: number }) {
  const ink = 'var(--color-ink)'
  const skin = 'var(--color-sky)'

  const eyes =
    mood === 'happy' || mood === 'proud'
      ? <>
          <path d="M33 45 q6 -7 12 0" stroke={ink} strokeWidth={4} fill="none" strokeLinecap="round" />
          <path d="M55 45 q6 -7 12 0" stroke={ink} strokeWidth={4} fill="none" strokeLinecap="round" />
        </>
      : <>
          <circle cx="39" cy="45" r="7" fill="#FFFDF6" stroke={ink} strokeWidth={3} />
          <circle cx="61" cy="45" r="7" fill="#FFFDF6" stroke={ink} strokeWidth={3} />
          <circle cx={mood === 'sheepish' ? 39 : 40} cy={mood === 'sheepish' ? 48 : 45} r="3" fill={ink} />
          <circle cx={mood === 'sheepish' ? 61 : 62} cy={mood === 'sheepish' ? 48 : 45} r="3" fill={ink} />
        </>

  const mouth =
    mood === 'happy' || mood === 'proud'
      ? <path d="M38 60 q12 12 24 0" stroke={ink} strokeWidth={4} fill="none" strokeLinecap="round" />
      : mood === 'sheepish'
      ? <path d="M40 64 q10 -7 20 0" stroke={ink} strokeWidth={4} fill="none" strokeLinecap="round" />
      : <path d="M42 62 h16" stroke={ink} strokeWidth={4} fill="none" strokeLinecap="round" />

  return (
    <motion.svg
      width={size} height={size} viewBox="0 0 100 100"
      animate={
        mood === 'proud' ? { y: [0, -7, 0], rotate: [0, -4, 4, 0] }
        : mood === 'sheepish' ? { rotate: [0, -3, 0] }
        : { y: [0, -3, 0] }
      }
      transition={{ duration: mood === 'proud' ? 0.7 : 2.6, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden="true"
    >
      {/* little cap */}
      <path d="M22 30 q28 -22 56 0 Z" fill="var(--color-tomato)" stroke={ink} strokeWidth={4} strokeLinejoin="round" />
      <line x1="18" y1="30" x2="82" y2="30" stroke={ink} strokeWidth={4.5} strokeLinecap="round" />
      {/* head */}
      <rect x="22" y="30" width="56" height="46" rx="16" fill={skin} stroke={ink} strokeWidth={4.5} />
      {eyes}
      {mouth}
      {/* body */}
      <path d="M34 76 v10 a6 6 0 0 0 6 6 h20 a6 6 0 0 0 6 -6 v-10"
            fill="var(--color-marigold)" stroke={ink} strokeWidth={4.5} strokeLinejoin="round" />
      {/* thought sparkle when proud */}
      {mood === 'proud' && (
        <g transform="translate(80 22)">
          <path d="M0 -9 L2.6 -2.6 L9 0 L2.6 2.6 L0 9 L-2.6 2.6 L-9 0 L-2.6 -2.6 Z"
                fill="var(--color-marigold)" stroke={ink} strokeWidth={2.8} strokeLinejoin="round" />
        </g>
      )}
    </motion.svg>
  )
}

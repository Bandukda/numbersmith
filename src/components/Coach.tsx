import { motion } from 'framer-motion'

/**
 * On-screen coaching.
 *
 * With the read-aloud narration gone, this is how a child who cannot yet
 * read the order card still knows what to do: a bouncing arrow aimed at
 * the thing to touch next, with a few short words beside it.
 *
 * It sits in normal layout flow rather than floating over the screen, so
 * it can never cover the very control it is pointing at.
 */
export function Coach({
  text, dir = 'down', tone = 'marigold',
}: {
  text: string
  dir?: 'up' | 'down' | 'left' | 'right'
  tone?: 'marigold' | 'teal' | 'tomato' | 'leaf'
}) {
  const bounce =
    dir === 'down' ? { y: [0, 7, 0] }
    : dir === 'up' ? { y: [0, -7, 0] }
    : dir === 'left' ? { x: [0, -7, 0] }
    : { x: [0, 7, 0] }

  const rotate =
    dir === 'down' ? 0 : dir === 'up' ? 180 : dir === 'left' ? 90 : -90

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 400, damping: 24 }}
      className={`ink hard-2 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5
                  font-display text-sm font-black bg-${tone}
                  ${tone === 'tomato' ? 'text-cream' : 'text-ink'}`}
    >
      <motion.span
        animate={bounce}
        transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transform: `rotate(${rotate}deg)` }}
        className="inline-flex"
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 4.5v15" />
          <path d="M5.6 13.2L12 19.6l6.4-6.4" />
        </svg>
      </motion.span>
      {text}
    </motion.div>
  )
}

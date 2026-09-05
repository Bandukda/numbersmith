import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { HERO_BY_ID, STARTER_HERO, cheerFrom } from '../engine/heroes'
import { HeroArt } from './HeroArt'

/*
  The hero who turns up when a child gets one right.

  Which hero it is comes from the roster and the child's own pick, so
  this file owns the arrival: the flight, the landing, and the bubble.
  What the hero looks like and what they say lives with the roster.

  The flight is the point of him: he comes in from off the right of the
  screen lying flat with one arm out ahead, crosses to the left, and only
  swings upright in the last stretch to land on his feet. Then, once he is
  standing still, the bubble pops up over his head.

  Doing it in that order matters. When the bubble arrived with him the
  whole thing read as one sliding lump rather than someone arriving and
  then speaking.
*/



/**
 * How long the flight takes. Everything else waits on it: he must be
 * standing still before he starts bobbing, waving or talking.
 */
const LAND = 1.15


export function Hero({ show, seed, name, heroId }: {
  show: boolean; seed: number; name?: string; heroId?: string
}) {
  const hero = HERO_BY_ID[heroId ?? STARTER_HERO] ?? HERO_BY_ID[STARTER_HERO]!
  const cheer = useMemo(() => cheerFrom(hero, seed, name), [hero, seed, name])
  /*
    He flew in already giving a thumbs up, which looked like a man being
    dragged sideways rather than someone flying. The gesture belongs to
    standing still, so the pose switches as he swings upright.
  */
  const [landed, setLanded] = useState(false)
  useEffect(() => {
    setLanded(false)
    if (!show) return
    const t = window.setTimeout(() => setLanded(true), LAND * 800)
    return () => window.clearTimeout(t)
  }, [show, seed])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={seed}
          /* the journey: in from off the right, high, and across to the left */
          initial={{ x: '100vw', y: -46, opacity: 0 }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          exit={{ x: '100vw', y: -40, opacity: 0, transition: { duration: 0.4, ease: 'easeIn' } }}
          transition={{
            opacity: { duration: 0.18 },
            default: { duration: LAND, ease: [0.16, 0.62, 0.24, 1] },
          }}
          className="pointer-events-none flex origin-top-left scale-[0.62] items-start
                     gap-1 sm:scale-90 sm:gap-2 md:scale-100"
        >
          {/*
            The pose. Held flat at -84 for most of the crossing, which with
            this drawing puts his head forward and his raised arm straight
            out ahead, then swung upright with a small overshoot so the
            landing settles rather than snapping.
          */}
          <motion.div
            className="shrink-0"
            style={{ marginTop: 34 }}
            initial={{ rotate: -84 }}
            animate={{ rotate: [-84, -84, -34, 7, -3, 0] }}
            transition={{
              duration: LAND + 0.18,
              times: [0, 0.4, 0.66, 0.84, 0.93, 1],
              ease: 'easeOut',
            }}
          >
            {/* standing bob, held back until he has actually landed */}
            <motion.div
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: LAND + 0.45 }}
            >
              <HeroArt hero={hero} landed={landed} />
            </motion.div>
          </motion.div>

          <CloudBubble text={cheer} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * How big the words are, by how many there are.
 *
 * Short cheers get to shout. A long one with a long name in it steps down
 * so it still fits the cloud.
 */
export function cheerSize(text: string): number {
  const n = text.trim().length
  if (n > 22) return 13
  if (n > 15) return 15
  return 18
}

/**
 * Comic bubble: an SVG cloud with the words laid over it as plain HTML.
 *
 * The words used to be SVG <text> with <tspan> lines, which renders fine
 * in Chrome and came out completely blank in Safari, so the hero flew in
 * and held up an empty cloud. SVG text is fragile across browsers, has no
 * wrapping of its own, and needs dominant-baseline to centre, which is
 * exactly the attribute Safari is worst at.
 *
 * HTML has none of those problems: it wraps by itself, centres with
 * flexbox and renders the same everywhere. The cloud stays SVG because a
 * cloud is a shape; the cheer is text, so it is text.
 */
function CloudBubble({ text }: { text: string }) {
  // An empty cloud is worse than no cloud: it reads as the hero having
  // nothing to say. If there is no line, there is no bubble.
  if (!text || !text.trim()) return null

  const bumps = [
    [26, 16, 17], [58, 10, 14], [90, 15, 16], [120, 22, 13],
    [22, 52, 16], [56, 60, 15], [92, 57, 16], [122, 48, 13],
    [12, 34, 15], [130, 34, 14],
  ] as const

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 15, delay: LAND + 0.3 }}
      className="relative -ml-1 shrink-0"
      style={{ width: 168, height: 97, transformOrigin: 'bottom left' }}
    >
      <svg viewBox="-6 -6 180 104" width={168} height={97} className="overflow-visible">
        <g fill="var(--color-cream)" stroke="var(--color-ink)" strokeWidth={3.5} strokeLinejoin="round">
          {bumps.map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} />)}
          <rect x={14} y={16} width={118} height={44} rx={16} />
          {/* tail on the left, three shrinking puffs aimed at his head */}
          <circle cx={19} cy={62} r={8} />
          <circle cx={8} cy={71} r={5.5} />
          <circle cx={0} cy={79} r={3.5} />
        </g>
        {/* seams between the bumps painted out, so the inside is one field */}
        <g fill="var(--color-cream)" stroke="none">
          <rect x={17} y={19} width={112} height={38} rx={13} />
          <circle cx={26} cy={16} r={14} /><circle cx={58} cy={10} r={11} />
          <circle cx={90} cy={15} r={13} /><circle cx={120} cy={22} r={10} />
          <circle cx={22} cy={52} r={13} /><circle cx={56} cy={60} r={12} />
          <circle cx={92} cy={57} r={13} /><circle cx={122} cy={48} r={10} />
          <circle cx={12} cy={34} r={12} /><circle cx={130} cy={34} r={11} />
        </g>
      </svg>

      {/*
        Sits exactly over the cloud's inner panel. The percentages come
        from that rect inside the viewBox, so the words stay put whatever
        the bubble is scaled to.
      */}
      <div
        className="pointer-events-none absolute grid place-items-center px-1 text-center
                   font-display font-black leading-tight text-ink"
        style={{
          left: '11.1%', top: '21.2%', width: '65.6%', height: '42.3%',
          fontSize: cheerSize(text),
        }}
      >
        <span>{text}</span>
      </div>
    </motion.div>
  )
}




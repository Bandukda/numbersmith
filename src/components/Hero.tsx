import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

/*
  Captain Number, who turns up when a child gets one right.

  The flight is the point of him: he comes in from off the right of the
  screen lying flat with one arm out ahead, crosses to the left, and only
  swings upright in the last stretch to land on his feet. Then, once he is
  standing still, the bubble pops up over his head.

  Doing it in that order matters. When the bubble arrived with him the
  whole thing read as one sliding lump rather than someone arriving and
  then speaking.
*/

const CHEERS = [
  'Nice work!', 'You did it!', 'Brilliant!', 'Super smart!',
  "That's the one!", 'Amazing!', 'Well done!', 'Sharp thinking!',
  'You nailed it!', 'Too easy for you!', 'Number power!', 'Spot on!',
]

/** The same cheers, with room for a name. */
const NAMED = [
  'Nice work, {n}!', 'You did it, {n}!', 'Brilliant, {n}!', 'Go {n}!',
  "That's the one, {n}!", 'Amazing, {n}!', 'Well done, {n}!', 'Sharp thinking, {n}!',
  'You nailed it, {n}!', 'Too easy, {n}!', 'Number hero, {n}!', 'Spot on, {n}!',
]

/**
 * A different cheer each time, picked from the celebration counter.
 *
 * Only every other one uses the name. Hearing it after every single
 * answer wears out fast, and the plain cheers in between are what keep
 * the named ones feeling like they were meant.
 *
 * The pass number is folded into that parity deliberately. Plain
 * `n % 2` against a list of even length only ever names the even
 * indices, which left half the named cheers unreachable; adding the pass
 * flips which half gets the name each time round the list.
 */
export function cheerFor(n: number, name = ''): string {
  const i = n % CHEERS.length
  const pass = Math.floor(n / CHEERS.length)
  const clean = name.trim()
  if (!clean || (n + pass) % 2 === 1) return CHEERS[i]!
  return NAMED[i]!.replace('{n}', clean)
}

/**
 * How long the flight takes. Everything else waits on it: he must be
 * standing still before he starts bobbing, waving or talking.
 */
const LAND = 1.15

/**
 * Split a cheer across at most two lines, breaking nearest the middle.
 *
 * A long name pushes the cheer past what the cloud can hold: "You nailed
 * it, Konstantinos!" rendered 160px wide inside a bubble with about 150px
 * of usable room, even at the smallest font step. Two balanced lines fit
 * comfortably and keep the text big enough to read.
 */
export function wrapCheer(text: string): string[] {
  if (text.length <= 15) return [text]
  const mid = text.length / 2
  let best = -1
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== ' ') continue
    if (best < 0 || Math.abs(i - mid) < Math.abs(best - mid)) best = i
  }
  return best < 0 ? [text] : [text.slice(0, best), text.slice(best + 1)]
}

export function Hero({ show, seed, name }: { show: boolean; seed: number; name?: string }) {
  const cheer = useMemo(() => cheerFor(seed, name), [seed, name])
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
              <Captain landed={landed} />
            </motion.div>
          </motion.div>

          <CloudBubble text={cheer} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Comic bubble built from overlapping circles, so the edge reads as cloud. */
function CloudBubble({ text }: { text: string }) {
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
      /*
        No top margin, while the Captain carries 34px of it. That gap is
        what lifts the bubble clear of his head: its tail then reaches down
        to him instead of pointing at his chest.
      */
      className="-ml-1 shrink-0"
      /* grows out of the tail, which points back at his head */
      style={{ transformOrigin: 'bottom left' }}
    >
      {/* slack in the viewBox so the ink and shadow cannot clip themselves */}
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
        {(() => {
          const lines = wrapCheer(text)
          const longest = Math.max(...lines.map((l) => l.length))
          const size = longest > 15 ? 13.5 : longest > 11 ? 15.5 : 18
          const top = lines.length === 1 ? 38 : 38 - (size * 1.1) / 2
          return (
            <text
              x={72} textAnchor="middle" dominantBaseline="middle"
              fontFamily="var(--font-display)" fontWeight={900}
              fontSize={size} fill="var(--color-ink)"
            >
              {lines.map((l, i) => (
                <tspan key={i} x={72} y={top + i * size * 1.1}>{l}</tspan>
              ))}
            </text>
          )
        })()}
      </svg>
    </motion.div>
  )
}

/** The character. Flat shapes and heavy ink, to match everything else. */
function Captain({ landed }: { landed: boolean }) {
  return (
    <svg width={112} height={132} viewBox="-4 -6 112 132" className="overflow-visible">
      <g stroke="var(--color-ink)" strokeWidth={3.6} strokeLinejoin="round" strokeLinecap="round">
        {/* cape, streaming behind him */}
        <motion.path
          fill="var(--color-tomato)"
          /* a real d for the first paint: with only `animate`, the very
             first frame renders d="undefined" and the console fills up */
          d="M34 34 C6 44 4 84 16 106 C30 92 44 92 56 96 C46 74 44 50 52 34 Z"
          animate={{ d: [
            'M34 34 C6 44 4 84 16 106 C30 92 44 92 56 96 C46 74 44 50 52 34 Z',
            'M34 34 C2 50 10 88 22 108 C34 90 46 90 58 94 C48 72 44 50 52 34 Z',
            'M34 34 C8 40 0 78 12 102 C28 90 44 92 56 96 C46 74 44 50 52 34 Z',
            'M34 34 C6 44 4 84 16 106 C30 92 44 92 56 96 C46 74 44 50 52 34 Z',
          ] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* legs: together and streamlined in flight, planted when standing */}
        <motion.path animate={{ d: landed ? 'M44 96 L40 118' : 'M46 96 L44 120' }}
                     stroke="var(--color-plum)" strokeWidth={11} />
        <motion.path animate={{ d: landed ? 'M62 96 L68 116' : 'M60 96 L64 120' }}
                     stroke="var(--color-plum)" strokeWidth={11} />
        <motion.path animate={{ d: landed ? 'M36 118 h12' : 'M40 121 h9' }}
                     strokeWidth={9} stroke="var(--color-ink)" />
        <motion.path animate={{ d: landed ? 'M64 116 h12' : 'M60 121 h9' }}
                     strokeWidth={9} stroke="var(--color-ink)" />
        {/* torso */}
        <rect x={36} y={52} width={36} height={48} rx={14} fill="var(--color-teal)" />
        {/* chest star */}
        <path d="M54 62l2.6 5.4 5.9.6-4.4 4 1.3 5.8L54 74.7l-5.4 3.1 1.3-5.8-4.4-4 5.9-.6z"
              fill="var(--color-marigold)" strokeWidth={2.4} />
        {/* trailing arm: swept back in flight, on the hip once standing */}
        <motion.path
          animate={{ d: landed ? 'M38 62 L26 76 L34 84' : 'M38 62 L32 82 L36 96' }}
          fill="none" stroke="var(--color-teal)" strokeWidth={11}
        />
        {/* right arm, raised, with a proper thumbs up */}
        <motion.g
          animate={landed ? { rotate: [0, -7, 0] } : { rotate: 0 }}
          transition={landed
            ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.25 }}
          style={{ transformOrigin: '70px 62px' }}
        >
          {/* punched straight out ahead while flying, bent up to wave when standing */}
          <motion.path
            animate={{ d: landed ? 'M70 62 L82 52' : 'M68 58 L80 40' }}
            fill="none" stroke="var(--color-teal)" strokeWidth={11}
          />
          {landed ? <ThumbsUp /> : <Fist />}
        </motion.g>
        {/* head */}
        <circle cx={54} cy={34} r={19} fill="var(--color-marigold)" />
        {/* mask */}
        <path d="M36 30 h36 v9 a7 7 0 01-11 4 l-7-4 -7 4 a7 7 0 01-11-4 z" fill="var(--color-plum)" />
        <circle cx={46} cy={33} r={2.6} fill="var(--color-cream)" stroke="none" />
        <circle cx={62} cy={33} r={2.6} fill="var(--color-cream)" stroke="none" />
        {/* grin */}
        <path d="M47 45 q7 6 14 0" fill="none" strokeWidth={3} />
      </g>
    </svg>
  )
}

/** A plain closed fist, for the arm punched out ahead in flight. */
function Fist() {
  return (
    <g>
      <rect x={74} y={22} width={20} height={19} rx={7}
            fill="var(--color-marigold)" strokeWidth={3.2}
            transform="rotate(-24 84 31)" />
      <g stroke="var(--color-ink)" strokeWidth={2} strokeLinecap="round"
         transform="rotate(-24 84 31)">
        <path d="M79 28 h11" /><path d="M79 34 h11" />
      </g>
    </g>
  )
}

/**
 * A closed fist with the thumb up.
 *
 * The first version was a square plus one thick stroke, which read as a
 * single raised finger rather than a thumbs up. The fist now has knuckle
 * lines across it so it is legibly a curled hand, and the thumb is a
 * rounded shape set off to the side rather than a line on top.
 */
function ThumbsUp() {
  return (
    <g>
      <rect x={76} y={30} width={22} height={20} rx={7} fill="var(--color-marigold)" strokeWidth={3.2} />
      <g stroke="var(--color-ink)" strokeWidth={2} strokeLinecap="round">
        <path d="M82 36.5 h13" /><path d="M82 42 h13" />
      </g>
      <path d="M80.5 31 v-9 a4.6 4.6 0 019.2 0 v9"
            fill="var(--color-marigold)" strokeWidth={3.2} strokeLinejoin="round" />
    </g>
  )
}

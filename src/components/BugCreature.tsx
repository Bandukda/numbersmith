import { motion } from 'framer-motion'
import type { BugSpecies } from '../engine/bugs'

/**
 * A bug, drawn as SVG.
 *
 * Five body shapes crossed with eye counts, leg counts and the toy
 * palette give fifteen creatures that read as deliberately designed
 * rather than randomly generated, with no art assets to ship.
 *
 * Loose bugs look mischievous and wobble. Caught bugs sit still and
 * smile, because catching one is meant to feel like making a friend
 * rather than killing a monster.
 */
export function BugCreature({
  species, size = 96, caught, silhouette, animate = true,
}: {
  species: BugSpecies
  size?: number
  caught?: boolean
  /** Not yet discovered: render as a flat mystery shape. */
  silhouette?: boolean
  animate?: boolean
}) {
  const fill = silhouette ? 'var(--color-shade)' : `var(--color-${species.colour})`
  const ink = 'var(--color-ink)'
  const s = size / 100

  // Body geometry per shape archetype.
  const body = {
    blob:  { cx: 50, cy: 52, rx: 32, ry: 29 },
    tall:  { cx: 50, cy: 50, rx: 25, ry: 34 },
    wide:  { cx: 50, cy: 55, rx: 37, ry: 24 },
    spiky: { cx: 50, cy: 52, rx: 30, ry: 28 },
    round: { cx: 50, cy: 52, rx: 30, ry: 30 },
  }[species.shape]

  const eyeYs = species.eyes === 1 ? [46] : [46]
  const eyeXs =
    species.eyes === 1 ? [50] :
    species.eyes === 2 ? [40, 60] : [36, 50, 64]

  return (
    <motion.svg
      width={size} height={size} viewBox="0 0 100 100"
      animate={animate && !caught ? { rotate: [-4, 4, -4], y: [0, -2, 0] } : { rotate: 0, y: 0 }}
      transition={{ duration: 2.2, repeat: animate && !caught ? Infinity : 0, ease: 'easeInOut' }}
      aria-hidden="true"
    >
      {/* legs */}
      {Array.from({ length: species.legs }).map((_, i) => {
        const half = species.legs / 2
        const left = i < half
        const idx = left ? i : i - half
        const x = body.cx + (left ? -1 : 1) * (body.rx * 0.55 - idx * 5)
        const y = body.cy + body.ry * 0.72
        return (
          <line
            key={i}
            x1={x} y1={y}
            x2={x + (left ? -9 : 9)} y2={y + 13}
            stroke={ink} strokeWidth={4.5} strokeLinecap="round"
          />
        )
      })}

      {/* antennae */}
      <line x1={body.cx - 9} y1={body.cy - body.ry * 0.86} x2={body.cx - 17} y2={body.cy - body.ry - 12}
            stroke={ink} strokeWidth={4} strokeLinecap="round" />
      <line x1={body.cx + 9} y1={body.cy - body.ry * 0.86} x2={body.cx + 17} y2={body.cy - body.ry - 12}
            stroke={ink} strokeWidth={4} strokeLinecap="round" />
      <circle cx={body.cx - 17} cy={body.cy - body.ry - 13} r={4} fill={fill} stroke={ink} strokeWidth={3.5} />
      <circle cx={body.cx + 17} cy={body.cy - body.ry - 13} r={4} fill={fill} stroke={ink} strokeWidth={3.5} />

      {/* spikes, for the spiky archetype */}
      {species.shape === 'spiky' &&
        [-24, -8, 8, 24].map((dx, i) => (
          <path
            key={i}
            d={`M ${body.cx + dx - 7} ${body.cy - body.ry + 6} L ${body.cx + dx} ${body.cy - body.ry - 9} L ${body.cx + dx + 7} ${body.cy - body.ry + 6} Z`}
            fill={fill} stroke={ink} strokeWidth={3.5} strokeLinejoin="round"
          />
        ))}

      {/* body */}
      <ellipse
        cx={body.cx} cy={body.cy} rx={body.rx} ry={body.ry}
        fill={fill} stroke={ink} strokeWidth={4.5}
      />

      {silhouette ? (
        <text
          x={50} y={60} textAnchor="middle"
          fontFamily="Outfit, sans-serif" fontWeight={900} fontSize={30}
          fill="var(--color-ink-dim)"
        >?</text>
      ) : (
        <>
          {/* eyes */}
          {eyeXs.map((x, i) => (
            <g key={i}>
              <circle cx={x} cy={eyeYs[0]} r={species.eyes === 3 ? 6.5 : 8} fill="#FFFDF6" stroke={ink} strokeWidth={3} />
              <circle
                cx={x + (caught ? 0 : 1.6)} cy={eyeYs[0]! + (caught ? 0 : 1.4)}
                r={species.eyes === 3 ? 2.6 : 3.4} fill={ink}
              />
            </g>
          ))}
          {/* mouth: a smile once caught, a smirk while loose */}
          {caught ? (
            <path d={`M ${body.cx - 10} ${body.cy + 12} q 10 9 20 0`}
                  stroke={ink} strokeWidth={3.6} fill="none" strokeLinecap="round" />
          ) : (
            <path d={`M ${body.cx - 9} ${body.cy + 14} q 9 -6 18 2`}
                  stroke={ink} strokeWidth={3.6} fill="none" strokeLinecap="round" />
          )}
        </>
      )}

      {/* a little sparkle once it is friendly */}
      {caught && !silhouette && (
        <g transform={`translate(${body.cx + body.rx - 2} ${body.cy - body.ry + 2})`}>
          <path d="M0 -8 L2.4 -2.4 L8 0 L2.4 2.4 L0 8 L-2.4 2.4 L-8 0 L-2.4 -2.4 Z"
                fill="var(--color-marigold)" stroke={ink} strokeWidth={2.6} strokeLinejoin="round" />
        </g>
      )}
      <rect width="100" height="100" fill="none" transform={`scale(${s})`} />
    </motion.svg>
  )
}

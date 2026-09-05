import { motion } from 'framer-motion'

/*
  Three ways to meet the same fraction.

  A child who only ever sees one model learns the picture rather than the
  idea: ask a bar-only learner to point at 3/4 on a line and they often
  cannot. So every fraction skill rotates through an area model laid out
  in a strip, the same area model wrapped into a circle, and the fraction
  as a position. The maths is identical; only the picture moves.
*/

const TAKEN = 'var(--color-tomato)'
const FREE = 'var(--color-shade)'

/** Wedge path for slice `i` of `n`, on a circle of radius r centred at c. */
function wedge(i: number, n: number, r: number, c: number): string {
  const a0 = (i / n) * Math.PI * 2 - Math.PI / 2
  const a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2
  const x0 = c + r * Math.cos(a0), y0 = c + r * Math.sin(a0)
  const x1 = c + r * Math.cos(a1), y1 = c + r * Math.sin(a1)
  // A slice bigger than a half needs the large-arc flag or it draws inside out.
  const large = a1 - a0 > Math.PI ? 1 : 0
  if (n === 1) {
    // A single "slice" is the whole circle, which has no wedge to draw.
    return `M ${c} ${c - r} A ${r} ${r} 0 1 1 ${c - 0.01} ${c - r} Z`
  }
  return `M ${c} ${c} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`
}

export function Pizza({ slices, taken, onTap, size = 190, locked }: {
  slices: number; taken: number[]; onTap?: (i: number) => void; size?: number; locked?: boolean
}) {
  const c = size / 2
  const r = c - 6
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      {/* crust */}
      <circle cx={c} cy={c} r={r + 3} fill="var(--color-ink)" />
      {Array.from({ length: slices }).map((_, i) => (
        <motion.path
          key={i}
          d={wedge(i, slices, r, c)}
          fill={taken.includes(i) ? TAKEN : FREE}
          stroke="var(--color-ink)"
          strokeWidth={3}
          strokeLinejoin="round"
          onClick={() => { if (!locked) onTap?.(i) }}
          whileTap={onTap && !locked ? { scale: 0.93 } : undefined}
          style={{ cursor: onTap && !locked ? 'pointer' : 'default', transformOrigin: `${c}px ${c}px` }}
        />
      ))}
    </svg>
  )
}

export function FractionBar({ slices, taken, onTap, locked }: {
  slices: number; taken: number[]; onTap?: (i: number) => void; locked?: boolean
}) {
  return (
    <div className="ink-thick hard-2 flex h-16 w-full gap-1 overflow-hidden rounded-blob bg-card p-1 sm:h-24">
      {Array.from({ length: slices }).map((_, i) => (
        <motion.button
          key={i}
          layout
          disabled={locked || !onTap}
          onClick={() => onTap?.(i)}
          whileTap={onTap && !locked ? { scale: 0.94 } : undefined}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className={`flex-1 rounded-xl border-[3px] border-ink
                      ${taken.includes(i) ? 'bg-tomato' : 'bg-shade'}`}
        />
      ))}
    </div>
  )
}

/**
 * The fraction as a position between 0 and 1.
 *
 * This is its own standard (3.NF.A.2) and the one children most often miss,
 * because a length is not a shaded shape: nothing is coloured in, so the
 * only thing that carries the meaning is where the marker sits.
 */
export function FractionLine({ denom, mark, onPick, locked, width = 400 }: {
  denom: number; mark: number | null; onPick?: (n: number) => void; locked?: boolean; width?: number
}) {
  const pad = 22
  const w = width, h = 84
  const span = w - pad * 2
  const x = (n: number) => pad + (n / denom) * span
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="max-w-full">
      <line x1={pad} y1={44} x2={w - pad} y2={44} stroke="var(--color-ink)" strokeWidth={4} strokeLinecap="round" />
      {Array.from({ length: denom + 1 }).map((_, i) => (
        <g key={i}>
          <line x1={x(i)} y1={i === 0 || i === denom ? 30 : 36} x2={x(i)} y2={i === 0 || i === denom ? 58 : 52}
                stroke="var(--color-ink)" strokeWidth={i === 0 || i === denom ? 4 : 2.5} strokeLinecap="round" />
          {/* Only the ends are labelled. Numbering every tick turns a
              length into a counting exercise and gives the answer away. */}
          {(i === 0 || i === denom) && (
            <text x={x(i)} y={76} textAnchor="middle" fontSize={18} fontWeight={900}
                  fill="var(--color-ink)" fontFamily="var(--font-display)">
              {i === 0 ? '0' : '1'}
            </text>
          )}
          {onPick && !locked && (
            // Generous invisible hit strip: the tick itself is far too thin
            // for a child's fingertip.
            <rect x={x(i) - 16} y={20} width={32} height={44} fill="transparent"
                  style={{ cursor: 'pointer' }} onClick={() => onPick(i)} />
          )}
        </g>
      ))}
      {mark !== null && (
        <motion.g animate={{ x: x(mark) }} initial={false}
                  transition={{ type: 'spring', stiffness: 420, damping: 30 }}>
          <circle cx={0} cy={44} r={13} fill="var(--color-tomato)" stroke="var(--color-ink)" strokeWidth={3.5} />
        </motion.g>
      )}
    </svg>
  )
}

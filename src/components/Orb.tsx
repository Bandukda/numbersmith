import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export type OrbTone = 'marigold' | 'tomato' | 'teal' | 'plum' | 'leaf' | 'berry' | 'sky' | 'blank'

/** Fill plus the ink colour that stays legible on it. */
const TONE: Record<OrbTone, { bg: string; fg: string }> = {
  marigold: { bg: 'bg-marigold', fg: 'text-ink' },
  tomato:   { bg: 'bg-tomato',   fg: 'text-cream' },
  teal:     { bg: 'bg-teal',     fg: 'text-ink' },
  plum:     { bg: 'bg-plum',     fg: 'text-cream' },
  leaf:     { bg: 'bg-leaf',     fg: 'text-ink' },
  berry:    { bg: 'bg-berry',    fg: 'text-cream' },
  sky:      { bg: 'bg-sky',      fg: 'text-ink' },
  blank:    { bg: 'bg-shade',    fg: 'text-ink-dim' },
}

/** Deterministic colour per value, so a given number always looks the same. */
const CYCLE: OrbTone[] = ['marigold', 'teal', 'tomato', 'plum', 'leaf', 'sky', 'berry']
export function toneFor(n: number): OrbTone {
  return CYCLE[Math.abs(Math.round(n)) % CYCLE.length]!
}

interface Props {
  value: ReactNode
  size?: number
  tone?: OrbTone
  grab?: boolean
  selected?: boolean
  spent?: boolean
  onClick?: () => void
  className?: string
  /** Make the orb draggable, and report where it was let go. */
  draggable?: boolean
  onDropAt?: (point: { x: number; y: number }) => void
  onDragStateChange?: (dragging: boolean) => void
}

/** A lump of number ore: flat colour, thick ink, hard shadow. */
export function Orb({
  value, size = 76, tone, grab, selected, spent, onClick, className = '',
  draggable, onDropAt, onDragStateChange,
}: Props) {
  const t = tone ?? (typeof value === 'number' ? toneFor(value) : 'marigold')
  const { bg, fg } = TONE[t]
  const chars = String(value).length
  const fontSize = size * (chars >= 4 ? 0.30 : chars === 3 ? 0.36 : chars === 2 ? 0.42 : 0.48)
  const border = size >= 60 ? 4 : 3

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      animate={{ opacity: spent ? 0.28 : 1, scale: spent ? 0.86 : 1 }}
      whileHover={onClick && !spent ? { y: -5 } : undefined}
      transition={{ type: 'spring', stiffness: 460, damping: 26 }}
      /*
        Draggable AND tappable. Dragging suits the "mash them together"
        metaphor, but a tap has to keep working: it is faster, and it is
        the only route for anyone who cannot drag.
      */
      drag={draggable && !spent ? true : false}
      dragSnapToOrigin
      dragElastic={0.14}
      dragMomentum={false}
      whileDrag={{ scale: 1.18, zIndex: 60, cursor: 'grabbing' }}
      onDragStart={() => onDragStateChange?.(true)}
      onDragEnd={(_, info) => {
        onDragStateChange?.(false)
        onDropAt?.({ x: info.point.x, y: info.point.y })
      }}
      className={`
        relative grid place-items-center rounded-full shrink-0 font-display font-black
        ${bg} ${fg} ${grab && !spent ? 'cursor-pointer pressable' : 'cursor-default'}
        ${selected ? 'ring-4 ring-ink ring-offset-4 ring-offset-paper' : ''}
        ${className}
      `}
      style={{
        width: size, height: size, fontSize,
        border: `${border}px solid var(--color-ink)`,
        boxShadow: spent ? 'none' : `${border + 1}px ${border + 1}px 0 var(--color-ink)`,
      }}
    >
      {value}
    </motion.button>
  )
}

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon, type IconName } from './Icon'
import { sTap } from '../audio/sound'

/* ── the shared vocabulary of the Toybox look ──────────────── */

export function Card({ children, className = '', tone = 'card' }: {
  children: ReactNode; className?: string; tone?: 'card' | 'paper' | 'shade'
}) {
  const bg = tone === 'card' ? 'bg-card' : tone === 'shade' ? 'bg-shade' : 'bg-paper'
  return <div className={`ink-thick hard-3 rounded-blob ${bg} ${className}`}>{children}</div>
}

export function Chip({ children, color = 'card', className = '' }: {
  children: ReactNode; color?: 'card' | 'marigold' | 'teal' | 'tomato' | 'plum' | 'leaf'; className?: string
}) {
  const bg = { card: 'bg-card', marigold: 'bg-marigold', teal: 'bg-teal',
               tomato: 'bg-tomato text-cream', plum: 'bg-plum text-cream', leaf: 'bg-leaf' }[color]
  return (
    <span className={`ink hard-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5
                      font-display text-sm font-extrabold whitespace-nowrap ${bg} ${className}`}>
      {children}
    </span>
  )
}

/** Small uppercase kicker. Used sparingly, it was overused before. */
export function Kicker({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`font-display text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink-mid ${className}`}>
      {children}
    </div>
  )
}

type BtnColor = 'tomato' | 'marigold' | 'teal' | 'plum' | 'leaf' | 'card'
const BTN: Record<BtnColor, string> = {
  tomato: 'bg-tomato text-cream', marigold: 'bg-marigold text-ink',
  teal: 'bg-teal text-ink', plum: 'bg-plum text-cream',
  leaf: 'bg-leaf text-ink', card: 'bg-card text-ink',
}

export function Button({
  children, onClick, color = 'card', size = 'md', disabled, className = '', icon,
}: {
  children?: ReactNode; onClick?: () => void; color?: BtnColor
  size?: 'sm' | 'md' | 'lg'; disabled?: boolean; className?: string; icon?: IconName
}) {
  const pad = size === 'lg' ? 'px-9 py-4 text-2xl rounded-blob'
            : size === 'sm' ? 'px-3.5 py-2 text-sm rounded-2xl'
            : 'px-5 py-2.5 text-base rounded-2xl'
  return (
    <button
      onClick={onClick ? () => { sTap(); onClick() } : undefined}
      disabled={disabled}
      className={`ink-thick hard-3 pressable inline-flex items-center justify-center gap-2.5
                  font-display font-black ${pad} ${BTN[color]}
                  disabled:opacity-40 disabled:pointer-events-none ${className}`}
    >
      {icon && <Icon name={icon} size={size === 'lg' ? 26 : 19} strokeWidth={2.8} />}
      {children}
    </button>
  )
}

/**
 * A hover label for the icon bar.
 *
 * The native `title` tooltip takes about a second to appear, renders in
 * the OS style, and is invisible on touch. With eight icons up there,
 * people need to know what they do without guessing.
 */
export function Tip({ label, children }: { label: string; children: ReactNode }) {
  const [show, setShow] = useState(false)
  const [shift, setShift] = useState(0)
  const wrapRef = useRef<HTMLSpanElement>(null)

  /*
    Centred tooltips on the rightmost buttons ran off the edge of the
    window. The offset lives on a plain wrapper, not on the animated
    element: Framer Motion writes its own `transform`, which silently
    overwrote an inline one and left the clamp doing nothing.
  */
  useLayoutEffect(() => {
    if (!show) { setShift(0); return }
    const el = wrapRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const pad = 10
    if (r.right > window.innerWidth - pad) setShift(window.innerWidth - pad - r.right)
    else if (r.left < pad) setShift(pad - r.left)
  }, [show, label])

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocusCapture={() => setShow(true)}
      onBlurCapture={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <span
            ref={wrapRef}
            style={{ marginLeft: shift }}
            className="pointer-events-none absolute left-1/2 top-full z-60 mt-2 -translate-x-1/2"
          >
            <motion.span
              initial={{ opacity: 0, y: -4, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.92 }}
              transition={{ duration: 0.12 }}
              role="tooltip"
              className="ink hard-1 block whitespace-nowrap rounded-xl bg-ink px-2.5 py-1.5
                         font-display text-xs font-extrabold text-paper"
            >
              {label}
            </motion.span>
          </span>
        )}
      </AnimatePresence>
    </span>
  )
}

export function IconButton({
  name, onClick, title, active, color = 'card',
}: { name: IconName; onClick?: () => void; title: string; active?: boolean; color?: BtnColor }) {
  return (
    <Tip label={title}>
      <button
        onClick={onClick ? () => { sTap(); onClick() } : undefined}
        aria-label={title}
        className={`ink hard-1 pressable grid h-9 w-9 place-items-center rounded-xl
                    sm:h-11 sm:w-11 sm:rounded-2xl
                    ${active === false ? 'bg-shade text-ink-dim' : BTN[color]}`}
      >
        <Icon name={name} size={21} strokeWidth={2.6} />
      </button>
    </Tip>
  )
}

/** A stitched-looking progress bar. */
export function Meter({ value, color = 'tomato', className = '', height = 12 }: {
  value: number; color?: string; className?: string; height?: number
}) {
  return (
    <div
      className={`ink overflow-hidden rounded-full bg-shade ${className}`}
      style={{ height }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
        transition={{ type: 'spring', stiffness: 150, damping: 24 }}
        className="h-full rounded-full"
        style={{ background: `var(--color-${color})` }}
      />
    </div>
  )
}


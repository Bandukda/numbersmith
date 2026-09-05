import { motion } from 'framer-motion'
import type { RepairBeat } from '../engine/types'

const ACCENT: Record<string, string> = {
  ember: 'var(--color-tomato)', cyan: 'var(--color-teal)',
  violet: 'var(--color-plum)', mint: 'var(--color-leaf)',
}

export function RepairVisual({ beat }: { beat: RepairBeat }) {
  const c = ACCENT[beat.accent ?? 'ember']!
  switch (beat.visual) {
    case 'rods':       return <Rods data={beat.data} c={c} />
    case 'array':      return <Array2D data={beat.data} c={c} />
    case 'numberline': return <NumberLine data={beat.data} c={c} />
    case 'bar':        return <SliceBar data={beat.data} c={c} />
    default:           return <OrbRow data={beat.data} c={c} />
  }
}

const INK = '3px solid var(--color-ink)'

function Rods({ data, c }: { data: number[]; c: string }) {
  const [tens = 0, ones = 0, take] = data
  return (
    <div className="flex min-h-[152px] flex-wrap items-end justify-center gap-7">
      <Group label="ten-sticks">
        {Array.from({ length: Math.min(tens, 12) }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.05, type: 'spring', stiffness: 380, damping: 24 }}
            className="origin-bottom rounded-md"
            style={{ width: 24, height: 116, background: c, border: INK, boxShadow: '3px 3px 0 var(--color-ink)' }}
          />
        ))}
      </Group>
      <Group label="ones">
        <div className="grid grid-cols-5 gap-1.5">
          {Array.from({ length: Math.min(ones, 20) }).map((_, i) => {
            const gone = take !== undefined && i >= ones - take
            return (
              <motion.div
                key={i}
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.08 + i * 0.03, type: 'spring', stiffness: 480, damping: 20 }}
                className="rounded-full"
                style={{
                  width: 22, height: 22, border: INK,
                  background: gone ? 'var(--color-shade)' : c,
                  opacity: gone ? 0.45 : 1,
                }}
              />
            )
          })}
        </div>
      </Group>
    </div>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="flex min-h-6 items-end gap-1.5">{children}</div>
      <span className="font-display text-[11px] font-extrabold uppercase tracking-widest text-ink-mid">{label}</span>
    </div>
  )
}

function Array2D({ data, c }: { data: number[]; c: string }) {
  const [rows = 3, cols = 3] = data
  const r = Math.min(rows, 10), col = Math.min(cols, 12)
  const size = Math.min(26, Math.floor(330 / Math.max(col, 5)))
  return (
    <div className="flex min-h-[152px] flex-col items-center justify-center gap-2.5">
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${col}, ${size}px)` }}>
        {Array.from({ length: r * col }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: Math.floor(i / col) * 0.08 + (i % col) * 0.016, type: 'spring', stiffness: 460, damping: 22 }}
            className="rounded-full"
            style={{ width: size, height: size, background: c, border: '2.5px solid var(--color-ink)' }}
          />
        ))}
      </div>
      <span className="font-display text-[11px] font-extrabold uppercase tracking-widest text-ink-mid">
        {rows} rows × {cols}
      </span>
    </div>
  )
}

function NumberLine({ data, c }: { data: number[]; c: string }) {
  const [a = 0, b = 0, answer = 0] = data
  const lo = Math.max(0, Math.min(a, answer) - 2)
  const hi = Math.max(a, answer) + 2
  const span = Math.max(hi - lo, 1)
  const pos = (n: number) => ((n - lo) / span) * 100

  return (
    <div className="grid min-h-[152px] w-full max-w-[520px] content-center px-3 pb-6 pt-10">
      <div className="relative h-1.5 rounded-full bg-ink">
        {Array.from({ length: span + 1 }).map((_, i) => {
          const n = lo + i
          const major = span <= 24 || n % 5 === 0
          return (
            <div key={i} className="absolute -translate-x-1/2 text-center" style={{ left: `${pos(n)}%`, top: major ? -8 : -5 }}>
              <div className="mx-auto bg-ink" style={{ width: 2.5, height: major ? 20 : 11 }} />
              {major && span <= 30 && (
                <span className="font-display text-[11px] font-extrabold text-ink-mid">{n}</span>
              )}
            </div>
          )
        })}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.abs(pos(answer) - pos(a))}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-0 h-1.5 rounded-full"
          style={{ left: `${Math.min(pos(a), pos(answer))}%`, background: c }}
        />
        {[{ n: a, land: false }, { n: answer, land: true }].map(({ n, land }) => (
          <motion.div
            key={land ? 'l' : 's'}
            initial={{ scale: 0, y: -8 }} animate={{ scale: 1, y: 0 }}
            transition={{ delay: land ? 0.7 : 0.1, type: 'spring', stiffness: 420, damping: 18 }}
            className="absolute -translate-x-1/2"
            style={{ left: `${pos(n)}%`, top: -36 }}
          >
            <div
              className="rounded-lg px-2.5 py-1 font-display text-base font-black"
              style={{ background: land ? c : 'var(--color-card)', border: INK, boxShadow: '2px 2px 0 var(--color-ink)' }}
            >{n}</div>
          </motion.div>
        ))}
      </div>
      <div className="mt-6 text-center font-display text-[11px] font-extrabold uppercase tracking-widest text-ink-mid">
        {b} step{b === 1 ? '' : 's'}
      </div>
    </div>
  )
}

function SliceBar({ data, c }: { data: number[]; c: string }) {
  const [d = 4] = data
  return (
    <div className="grid min-h-[152px] w-full max-w-[480px] content-center gap-3.5">
      <div className="flex h-20 gap-1.5">
        {Array.from({ length: d }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: i * 0.07, type: 'spring', stiffness: 340, damping: 26 }}
            className="flex-1 rounded-xl"
            style={{ background: i === 0 ? c : 'var(--color-shade)', border: INK }}
          />
        ))}
      </div>
      <div className="text-center font-display text-[11px] font-extrabold uppercase tracking-widest text-ink-mid">
        one whole, tempered into {d}
      </div>
    </div>
  )
}

function OrbRow({ data, c }: { data: number[]; c: string }) {
  return (
    <div className="flex min-h-[152px] flex-wrap items-center justify-center gap-5">
      {data.slice(0, 3).map((n, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: i * 0.12, type: 'spring', stiffness: 420, damping: 18 }}
          className="grid place-items-center rounded-full font-display text-4xl font-black text-ink"
          style={{ width: 94, height: 94, background: c, border: '4px solid var(--color-ink)', boxShadow: '5px 5px 0 var(--color-ink)' }}
        >{n}</motion.div>
      ))}
    </div>
  )
}

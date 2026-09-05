import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Kicker } from '../ui'
import { Coach } from '../Coach'

/*
  The area model, for multiplications too big to draw as dots.

  17 x 15 is 255 dots. No screen shows that in a way a child can count, and
  the old fallback quietly gave up: it kept the two steppers and dropped the
  picture, so the child set "17" and "15" to match numbers the prompt had
  already told them, and saw nothing. The interaction only ever existed to
  build the picture, so with no picture there was no reason to interact.

  Splitting each number into tens and ones is how this is taught (4.NBT.B.5):
  17 x 15 becomes 10x10 + 10x5 + 7x10 + 7x5. Every part is a fact the child
  already owns, and the rectangle shows why the parts add up to the whole.
*/

/** Split a number into the bands the area model draws: tens, then ones. */
export function bands(n: number): number[] {
  const tens = Math.floor(n / 10) * 10
  const ones = n % 10
  return [tens, ones].filter((x) => x > 0)
}

export function AreaModel({ rows, cols, onComplete, locked }: {
  rows: number; cols: number; onComplete: () => void; locked?: boolean
}) {
  const rb = bands(rows)
  const cb = bands(cols)
  const total = rb.length * cb.length
  const [seen, setSeen] = useState<string[]>([])

  useEffect(() => { setSeen([]) }, [rows, cols])
  useEffect(() => { if (seen.length >= total) onComplete() }, [seen.length, total, onComplete])

  const reveal = (k: string) => { if (!locked && !seen.includes(k)) setSeen((s) => [...s, k]) }

  return (
    <div className="flex w-full max-w-[520px] flex-col items-center gap-3">
      <Kicker>{rows} split into {rb.join(' and ')}, {cols} split into {cb.join(' and ')}</Kicker>

      <div className="flex w-full gap-1.5">
        {/* left gutter carries the row band labels */}
        <div className="flex w-9 shrink-0 flex-col gap-1.5 pt-7">
          {rb.map((r) => (
            <div key={r} className="grid place-items-center font-display text-lg font-black text-ink"
                 style={{ flexGrow: r, flexBasis: 0 }}>
              {r}
            </div>
          ))}
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex gap-1.5">
            {cb.map((c) => (
              <div key={c} className="grid h-6 place-items-center font-display text-lg font-black text-ink"
                   style={{ flexGrow: c, flexBasis: 0 }}>
                {c}
              </div>
            ))}
          </div>

          {rb.map((r) => (
            <div key={r} className="flex gap-1.5" style={{ flexGrow: r, flexBasis: 0 }}>
              {cb.map((c) => {
                const k = `${r}x${c}`
                const on = seen.includes(k)
                return (
                  <motion.button
                    key={k}
                    disabled={locked}
                    onClick={() => reveal(k)}
                    whileTap={locked ? undefined : { scale: 0.97 }}
                    aria-label={`${r} times ${c}`}
                    className={`ink hard-1 grid place-items-center rounded-xl
                                ${on ? 'bg-plum text-cream' : 'bg-card text-ink'}`}
                    style={{ flexGrow: c, flexBasis: 0, minHeight: 54 }}
                  >
                    {on
                      ? <motion.span initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                     className="font-display text-2xl font-black">{r * c}</motion.span>
                      : <span className="font-display text-sm font-black opacity-55">{r} × {c}</span>}
                  </motion.button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {seen.length >= total
        ? <Coach text="Now add the parts up" dir="down" tone="teal" />
        : <Coach text="Tap each part to work it out" dir="up" tone="marigold" />}
    </div>
  )
}

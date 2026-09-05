import { useEffect, useRef, useState } from 'react'

/*
  Sparks that fall behind the cursor.

  Three rules keep a decoration from becoming a problem.

  It must never be in the way. The layer is fixed and pointer-events
  none, so nothing on it can take a tap meant for the game. It sits above
  the screens rather than below them: underneath, each screen's own
  background painted straight over the sparks and they were invisible.
  It stays below the modals, which should never have glitter on them.

  It must never cost a device that gains nothing from it. Coarse pointers
  have no cursor to trail, and anyone who has asked their machine for
  less motion has asked for exactly this to stop.

  And it must not multiply. Sparks are spawned per distance travelled
  rather than per mouse event, so a fast sweep across the screen makes
  the same handful a slow one does, and the list is hard-capped.
*/

const MAX = 14
/** Pixels of travel between sparks. Tuned so a fast sweep is a trail, not a smear. */
const SPACING = 34
const LIFE = 620

interface Spark { id: number; x: number; y: number; hue: string; size: number; born: number }

const HUES = ['var(--color-marigold)', 'var(--color-tomato)', 'var(--color-teal)']

export function SparkleTrail() {
  const [sparks, setSparks] = useState<Spark[]>([])
  const last = useRef<{ x: number; y: number } | null>(null)
  const seq = useRef(0)

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || still) return

    /*
      One sweeper rather than a timer per spark. The per-spark version
      worked, but it kept an id for every spark ever made: a few thousand
      dead handles by the end of a long session, growing for as long as
      the child plays.
    */
    const sweep = window.setInterval(
      () => setSparks((s) => {
        const live = s.filter((k) => Date.now() - k.born < LIFE)
        return live.length === s.length ? s : live
      }), 200)

    const onMove = (e: PointerEvent) => {
      const prev = last.current
      if (prev) {
        const dx = e.clientX - prev.x
        const dy = e.clientY - prev.y
        if (Math.hypot(dx, dy) < SPACING) return
      }
      last.current = { x: e.clientX, y: e.clientY }

      const id = ++seq.current
      const spark: Spark = {
        id,
        x: e.clientX,
        y: e.clientY,
        hue: HUES[id % HUES.length]!,
        size: 14 + (id % 3) * 5,
        born: Date.now(),
      }
      setSparks((s) => [...s, spark].slice(-MAX))
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      clearInterval(sweep)
    }
  }, [])

  if (!sparks.length) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-90 overflow-hidden" aria-hidden="true">
      {sparks.map((s) => (
        /*
          Drawn with the same heavy ink as the rest of the game. A plain
          coloured shape was invisible against art this bold: it needs an
          outline to exist, exactly like every other object here.
        */
        <svg
          key={s.id}
          className="absolute block animate-spark overflow-visible"
          width={s.size} height={s.size} viewBox="0 0 30 30"
          style={{ left: s.x, top: s.y, marginLeft: -s.size / 2, marginTop: -s.size / 2 }}
        >
          <path
            d="M15 1 L18.2 11.8 L29 15 L18.2 18.2 L15 29 L11.8 18.2 L1 15 L11.8 11.8 Z"
            fill={s.hue} stroke="var(--color-ink)" strokeWidth={2.6} strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  )
}

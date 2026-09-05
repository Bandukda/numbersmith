import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useViewport } from '../../hooks/useViewport'
import { Anvil } from './Anvil'
import { AreaModel } from './AreaModel'
import { Chip, IconButton, Kicker } from '../ui'
import { Coach } from '../Coach'
import { useGame } from '../../state/store'
import * as S from '../../audio/sound'
import type { Order } from '../../engine/types'

const MAX_R = 10, MAX_C = 12

/** STAMP, multiplication as a rectangular array you press out. */
export function StampStage({ order, locked }: { order: Order; locked: boolean }) {
  const [rows, cols] = order.ore as [number, number]
  const [r, setR] = useState(1)
  const [c, setC] = useState(1)
  const [lay, setLay] = useState(1)
  const soundOn = useGame((s) => s.soundOn)
  const setPhase = useGame((s) => s.setPhase)
  const phase = useGame((s) => s.phase)
  const { w: vw, h: vh } = useViewport()

  useEffect(() => { setR(1); setC(1); setLay(1) }, [order.id])

  const narrow = vw < 560

  /* Plate sizing, computed before the layout choice so the choice can use it. */
  const headroom = narrow ? 1 : 2
  const plateR = Math.min(MAX_R, rows + headroom)
  const plateC = Math.min(MAX_C, cols + headroom)
  // Both dimensions matter: a landscape tablet is wide but short, and a
  // fixed height allowance squeezed the cells to 29px there.
  const availW = Math.min(narrow ? 340 : 460, vw - 96)
  // Chrome above and below the stage costs ~500px, and the plate's own
  // label and chip ~90 more, so this is the room the grid actually gets.
  const availH = Math.max(150, Math.min(360, vh - 592))
  const cell = Math.min(40, Math.floor(availW / plateC), Math.floor(availH / plateR))

  /*
    An array cannot always have both a readable rectangle and finger-sized
    cells. When the cells come out too small to tap, the array is drawn
    read-only instead: a picture the child cannot poke still teaches, but
    a control with nothing to show does not.
  */
  const MIN_CELL = 34
  // A number past ten is a maths problem; a squeezed cell is a space problem.
  const multiDigit = rows > MAX_R || cols > MAX_C
  const cramped = !multiDigit && cell < MIN_CELL
  const set = order.layers ? lay === order.layers : r === rows && c === cols

  useEffect(() => {
    /*
      A pre-drawn array has nothing to build, so it is ready immediately.
      The whole branch has to return: falling through reached the reset
      below, which sent it straight back to 'building' and ping-ponged the
      two states for ever. It crashed the screen on any narrow viewport
      where the array was too big to tap.
    */
    if (cramped) {
      if (phase === 'building') setPhase('calling')
      return
    }
    if (multiDigit) return
    if (set && phase === 'building') { if (soundOn) S.sStamp(); setPhase('calling') }
    if (!set && phase === 'calling') setPhase('building')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set, phase])

  /*
    Volume is an array with a height. Showing only the floor and calling it
    volume is what the old build did, and it made the skill a lie: the
    child needs to see the layers stack to know why they multiply again.
  */
  if (order.layers) {
    const layers = order.layers
    const done = lay === layers
    /*
      Layers are drawn side by side rather than piled up.

      A real stack hides its own middle: the first build overlapped the
      layers by a few pixels and the result just looked like one blurry
      grid, so there was nothing a child could count. Pulling the layers
      apart costs the tower shape but buys the only thing that matters
      here, which is seeing that the same square of cubes repeats.
    */
    const perLayer = Math.floor((Math.min(560, vw - 96) - (layers - 1) * 26) / layers)
    const cv = Math.max(11, Math.min(22, Math.floor((perLayer - 14 - (cols - 1) * 3) / cols)))
    return (
      <Anvil hot={done}>
        <div className="flex flex-col items-center gap-3">
          <Kicker>Every layer is {rows} by {cols}</Kicker>
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: lay }).map((_, L) => (
              <div key={L} className="flex items-center gap-2">
                {L > 0 && <span className="font-display text-xl font-black text-ink/45">+</span>}
                <div className="ink hard-1 rounded-xl bg-card p-1.5">
                  <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${cols}, ${cv}px)` }}>
                    {Array.from({ length: rows * cols }).map((__, i) => (
                      <div key={i} className="rounded-[4px] border-2 border-ink bg-plum"
                           style={{ width: cv, height: cv, boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.35)' }} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-1 flex items-center gap-4">
            <Stepper label="Layers" value={lay} target={layers} onChange={setLay} disabled={locked} />
          </div>
          {done
            ? <Coach text="Now guess how many cubes altogether" dir="down" tone="teal" />
            : <Coach text={`Add layers until you have ${layers}`} dir="up" tone="marigold" />}
        </div>
      </Anvil>
    )
  }

  /*
    Too big to draw as dots. Which of the two ways out we take depends on
    WHY it is too big.

    Genuinely multi-digit (17 x 15) is a maths problem, and gets the area
    model: split into tens and ones and work the parts. Small numbers on a
    small screen is only a space problem, so the array still gets drawn,
    just read-only and shrunk to fit rather than replaced by steppers.
  */
  if (multiDigit) {
    return (
      <Anvil hot={phase !== 'building'}>
        <AreaModel rows={rows} cols={cols} locked={locked}
                   onComplete={() => { if (phase === 'building') { if (soundOn) S.sStamp(); setPhase('calling') } }} />
      </Anvil>
    )
  }

  if (cramped) {
    const cv = Math.max(9, Math.min(cell, Math.floor((Math.min(520, vw - 96) - (cols - 1) * 4) / cols)))
    return (
      <Anvil hot>
        <div className="flex flex-col items-center gap-3">
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, ${cv}px)` }}>
            {Array.from({ length: rows * cols }).map((_, i) => (
              <div key={i} className="rounded-full border-2 border-ink bg-tomato"
                   style={{ width: cv, height: cv }} />
            ))}
          </div>
          <Chip color="plum">{rows} row{rows === 1 ? '' : 's'} of {cols}</Chip>
          <Coach text="Now guess how many dots" dir="down" tone="teal" />
        </div>
      </Anvil>
    )
  }

  return (
    <Anvil hot={set}>
      <div className="flex flex-col items-center gap-3.5">
        {set
          ? <Coach text="Now guess how many dots" dir="down" tone="teal" />
          : <Coach text={`Tap to make ${rows} row${rows === 1 ? '' : 's'} of ${cols}`} dir="down" tone="marigold" />}
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${plateC}, ${cell}px)` }}>
          {Array.from({ length: plateR * plateC }).map((_, i) => {
            const rr = Math.floor(i / plateC) + 1
            const cc = (i % plateC) + 1
            const on = rr <= r && cc <= c
            return (
              <button
                key={i}
                disabled={locked}
                /*
                  Hover sizing stops once the target is matched. Leaving it
                  live caused a feedback loop: matching the array slid the
                  answer orbs in, which shifted the plate under the cursor,
                  which fired mouseenter on a different cell, which unset the
                  match and slid the orbs away again, for ever.
                */
                onMouseEnter={() => { if (!locked && !set) { setR(rr); setC(cc) } }}
                onClick={() => { if (!locked) { setR(rr); setC(cc); if (soundOn) S.sPop(Math.min(rr + cc - 2, 6)) } }}
                aria-label={`${rr} row${rr === 1 ? '' : 's'} of ${cc}`}
                className="grid place-items-center"
                style={{ width: cell, height: cell }}
              >
                {/* the dot scales, the button does not: transforming the
                    button would shrink its tap target along with it */}
                <motion.span
                  animate={{ scale: on ? 1 : 0.6 }}
                  transition={{ duration: 0.1 }}
                  className={`block h-full w-full rounded-full
                              ${on ? (set ? 'bg-plum' : 'bg-tomato') : 'bg-ink/15'}`}
                  style={{
                    border: on ? '2.5px solid var(--color-ink)' : 'none',
                    boxShadow: on ? '2px 2px 0 var(--color-ink)' : 'none',
                  }}
                />
              </button>
            )
          })}
        </div>
        <Chip color={set ? 'plum' : 'card'}>{r} row{r === 1 ? '' : 's'} of {c}</Chip>
      </div>
    </Anvil>
  )
}

function Stepper({ label, value, target, onChange, disabled }: {
  label: string; value: number; target: number; onChange: (n: number) => void; disabled?: boolean
}) {
  const ok = value === target
  return (
    <div className="text-center">
      <Kicker className="mb-2">{label}</Kicker>
      <div className="flex items-center gap-2">
        <IconButton name="minus" title={`Fewer ${label}`} onClick={() => onChange(Math.max(1, value - 1))} />
        <div className={`ink hard-2 grid h-16 w-20 place-items-center rounded-2xl ${ok ? 'bg-plum' : 'bg-card'}`}>
          <span className={`font-display text-3xl font-black ${ok ? 'text-cream' : 'text-ink'}`}>{value}</span>
        </div>
        <IconButton name="plus" title={`More ${label}`} onClick={() => onChange(Math.min(40, value + 1))} />
      </div>
      <Kicker className="mt-2">need {target}</Kicker>
    </div>
  )
}

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Orb } from '../Orb'
import { Anvil } from './Anvil'
import { Button, Kicker } from '../ui'
import { Coach } from '../Coach'
import { useGame } from '../../state/store'
import { useViewportWidth } from '../../hooks/useViewport'
import * as S from '../../audio/sound'
import { fmt } from '../../engine/format'
import type { Order } from '../../engine/types'

/**
 * MASH, addition made physical, in the two shapes addition actually takes.
 *
 * BOND: the total is on the card, so the question is *which two numbers
 * make it*. The answer is the pair, and there is nothing to type. An
 * earlier version asked for the pair AND a typed total, which meant
 * copying a number straight off the screen, and worse, the typed total
 * was all that got graded, so the orbs were decorative.
 *
 * SUM: the two numbers are on the anvil and the total is genuinely
 * unknown, so this one keeps call-your-shot and the answer orbs.
 */
export function FuseStage({ order, locked }: { order: Order; locked: boolean }) {
  const [staged, setStaged] = useState<number[]>([])
  const [used, setUsed] = useState<number[]>([])
  const soundOn = useGame((s) => s.soundOn)
  const setPhase = useGame((s) => s.setPhase)
  const phase = useGame((s) => s.phase)
  const submitBond = useGame((s) => s.submitBond)
  const hintUsed = useGame((s) => s.hintUsed)
  const narrow = useViewportWidth() < 560
  const anvilRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  /** Was the orb let go over the anvil? */
  const droppedOnAnvil = (pt: { x: number; y: number }) => {
    const r = anvilRef.current?.getBoundingClientRect()
    if (!r) return false
    return pt.x >= r.left && pt.x <= r.right && pt.y >= r.top && pt.y <= r.bottom
  }

  const isSum = order.mode === 'sum'

  useEffect(() => { setStaged([]); setUsed([]) }, [order.id])

  // A sum order hands the child both numbers: nothing to choose.
  useEffect(() => {
    if (isSum && phase === 'building') setPhase('calling')
  }, [isSum, phase, setPhase, order.id])

  /*
    A bond order has no answer orbs to thin out, so the usual hint had
    nothing to act on and simply never appeared. That left most of
    Kindergarten with no help at all, which is precisely backwards.

    Its hint places the first number instead: half the problem solved,
    the partner left to find. Whatever the child had staged is cleared
    first, since a hint arriving on top of a wrong guess would leave a
    pair on the anvil that nobody chose.
  */
  useEffect(() => {
    if (!hintUsed || isSum || locked) return
    const want = order.sentence.a
    const idx = order.ore.findIndex((v) => v === want)
    if (idx < 0) return
    if (soundOn) S.sPlace()
    setStaged([want])
    setUsed([idx])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hintUsed, order.id])

  const need = order.pieces ?? 2
  const shown = isSum ? order.ore.slice(0, 2) : staged
  const full = isSum || staged.length >= need

  const place = (v: number, idx: number) => {
    if (locked || full || used.includes(idx)) return
    if (soundOn) S.sPop(staged.length)
    setStaged((s) => [...s, v])
    setUsed((u) => [...u, idx])
  }

  /*
    Take one back.

    The tray holds exactly one winning pair and four decoys, on purpose:
    a second winning pair would make the child's choice tell us nothing.
    But that meant tapping a decoy first was a dead end. A child who put
    down the 1 when the answer was 3 and 3 was told "One more! Find 5",
    went hunting for a 5 that was never there, and had no way out but
    Start over, which reads as being told off for one tap.

    So the tray stays as it is and the placement stops being final.
    Tapping a number on the anvil sends it back where it came from.
  */
  const unplace = (i: number) => {
    if (locked || isSum) return
    if (soundOn) S.sLift()
    setStaged((s) => s.filter((_, k) => k !== i))
    setUsed((u) => u.filter((_, k) => k !== i))
  }

  const clearBench = () => {
    if (locked) return
    if (soundOn) S.sLift()
    setStaged([]); setUsed([])
  }

  /*
    What is still missing, and whether it is actually there to be found.
    Saying "Find 5" when no 5 is on the tray sends a five-year-old looking
    for something that does not exist.
  */
  const wanted = !isSum && staged.length === 1 ? order.target - staged[0]! : null
  const partnerOnTray =
    wanted !== null && order.ore.some((v, i) => !used.includes(i) && v === wanted)

  const bang = () => {
    if (locked || staged.length < 2) return
    if (soundOn) S.sStrike()
    submitBond(staged[0]!, staged[1]!)
  }

  return (
    <div className="flex w-full flex-col items-center gap-3 sm:gap-6">
      <div ref={anvilRef} className="w-full">
      <Anvil hot={full || dragging}>
        <div className="flex min-h-[80px] items-center gap-4 sm:min-h-[104px] sm:gap-6">
          {Array.from({ length: need }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 sm:gap-6">
              {i > 0 && (
                <span className={`font-display text-4xl font-black text-ink transition-opacity
                                  ${shown.length > i ? 'opacity-100' : 'opacity-30'}`}>+</span>
              )}
              <AnimatePresence mode="popLayout">
                {shown[i] !== undefined ? (
                  <motion.div
                    key={`s${i}-${shown[i]}`}
                    initial={{ scale: 0.2, y: 80, rotate: -18, opacity: 0 }}
                    animate={{ scale: 1, y: 0, rotate: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 20 }}
                  >
                    <Orb
                      value={fmt(shown[i]!, order.scale)} size={narrow ? 74 : 96}
                      onClick={isSum || locked ? undefined : () => unplace(i)}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key={`e${i}`}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="grid h-[74px] w-[74px] place-items-center rounded-full border-4 border-dashed border-ink/35 sm:h-24 sm:w-24"
                  >
                    <span className="font-display text-3xl font-black text-ink/30">?</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
          {isSum && (
            <>
              <span className="font-display text-4xl font-black text-ink/40">=</span>
              <span className="font-display text-4xl font-black text-ink/40">?</span>
            </>
          )}
        </div>
      </Anvil>
      </div>

      {isSum ? (
        <Coach text="Tap what they make" dir="down" tone="teal" />
      ) : (
        <div className="flex flex-col items-center gap-2 sm:gap-3">
          {full
            ? <Coach text={`Now BANG to check!`} dir="down" tone="tomato" />
            : <Coach
                text={
                  staged.length === 0
                    ? `Drag or tap two numbers that make ${order.target}`
                    : partnerOnTray
                      ? `One more! Find ${fmt(wanted!, order.scale)}`
                      : `No ${fmt(wanted!, order.scale)} here. Tap the ${fmt(staged[0]!, order.scale)} to put it back`
                }
                dir="down" tone={partnerOnTray || staged.length === 0 ? 'marigold' : 'teal'}
              />}
          <div className="flex max-w-2xl flex-wrap justify-center gap-2.5 sm:gap-3.5">
            {order.ore.map((v, i) => (
              <Orb
                key={`${order.id}-${i}`} value={fmt(v, order.scale)} size={narrow ? 54 : 68}
                grab={!locked && !full} spent={used.includes(i)}
                onClick={() => place(v, i)}
                draggable={!locked && !full && !used.includes(i)}
                onDragStateChange={setDragging}
                onDropAt={(pt) => { if (droppedOnAnvil(pt)) place(v, i) }}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            {staged.length > 0 && !locked && (
              <Button size="sm" icon="undo" onClick={clearBench}>Start over</Button>
            )}
            <Button
              color="tomato" size="md" icon="hammer"
              disabled={staged.length < 2 || locked}
              onClick={bang}
            >
              BANG!
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

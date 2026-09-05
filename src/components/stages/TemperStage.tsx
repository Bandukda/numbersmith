import { useEffect, useState } from 'react'
import { Anvil } from './Anvil'
import { Button, Chip, IconButton, Kicker } from '../ui'
import { Coach } from '../Coach'
import { Pizza, FractionBar, FractionLine } from './FractionModels'
import { useGame } from '../../state/store'
import * as S from '../../audio/sound'
import type { Order } from '../../engine/types'

/**
 * TEMPER, fractions.
 *
 * The child sets CUTS, not parts: cuts-versus-parts is a real confusion,
 * and making it reachable is what lets the radar catch it.
 *
 * The picture rotates between a strip, a pizza and a number line so the
 * fraction is not welded to one shape in the child's head.
 */
export function TemperStage({ order, locked }: { order: Order; locked: boolean }) {
  const wantD = order.denom ?? 4
  const wantN = order.target
  const shape = order.shape ?? 'bar'
  const [cuts, setCuts] = useState(1)
  const [taken, setTaken] = useState<number[]>([])
  const [mark, setMark] = useState<number | null>(null)
  const soundOn = useGame((s) => s.soundOn)
  const submitTemper = useGame((s) => s.submitTemper)

  useEffect(() => { setCuts(1); setTaken([]); setMark(null) }, [order.id])

  const slices = cuts + 1
  const ready = shape === 'line' ? mark !== null && mark > 0 : taken.length > 0

  const toggle = (i: number) => {
    if (locked) return
    if (soundOn) S.sPop(taken.includes(i) ? 0 : taken.length)
    setTaken((t) => (t.includes(i) ? t.filter((x) => x !== i) : [...t, i]))
  }

  /* The line already has its denominator drawn, so the only thing the
     child chooses is where the fraction sits. */
  if (shape === 'line') {
    return (
      <div className="flex w-full flex-col items-center gap-3 sm:gap-5">
        <Anvil hot={ready}>
          <div className="flex w-full max-w-[560px] flex-col items-center gap-2">
            <Kicker>The line is cut into {wantD} equal steps</Kicker>
            <FractionLine
              denom={wantD} mark={mark} locked={locked}
              onPick={(n) => { if (soundOn) S.sPop(Math.min(n, 6)); setMark(n) }}
            />
            <Chip color={ready ? 'plum' : 'card'}>
              {mark === null ? 'Tap a step' : `${mark} of ${wantD}`}
            </Chip>
          </div>
        </Anvil>
        <Button
          color="tomato" size="lg" icon="hammer"
          disabled={!ready || locked}
          onClick={() => { if (soundOn) S.sStrike(); submitTemper(wantD, mark ?? 0) }}
        >
          BANG! Land on {mark ?? 0}/{wantD}
        </Button>
        {ready
          ? <Coach text="Now BANG to check!" dir="up" tone="tomato" />
          : <Coach text={`Hop to ${wantN} step${wantN === 1 ? '' : 's'} along`} dir="up" tone="marigold" />}
      </div>
    )
  }

  const ref = order.frac2

  return (
    <div className="flex w-full flex-col items-center gap-3 sm:gap-5">
      <Anvil hot={ready}>
        <div className="flex w-full max-w-[600px] flex-col items-center gap-3 sm:gap-5">
          {/*
            The fraction being matched, added to or divided into, shown in
            the same picture the child is working in so the two can be
            compared by eye rather than by arithmetic.
          */}
          {ref && (
            <div className="flex w-full flex-col items-center gap-1.5">
              <Kicker>{order.fracTask === 'add' ? 'Start with' : order.fracTask === 'mult' ? 'Take a part of' : 'Match this'} {ref.n}/{ref.d}</Kicker>
              <div className="pointer-events-none w-full opacity-80">
                {shape === 'pizza'
                  ? <div className="flex justify-center"><Pizza slices={ref.d} taken={Array.from({ length: ref.n }, (_, i) => i)} size={116} locked /></div>
                  : <FractionBar slices={ref.d} taken={Array.from({ length: ref.n }, (_, i) => i)} locked />}
              </div>
              <div className="my-0.5 h-0.5 w-24 rounded bg-ink/25" />
            </div>
          )}
          {shape === 'pizza'
            ? <Pizza slices={slices} taken={taken} onTap={toggle} locked={locked} />
            : <FractionBar slices={slices} taken={taken} onTap={toggle} locked={locked} />}

          <div className="flex items-center justify-center gap-3">
            <Kicker>Cuts</Kicker>
            <IconButton name="minus" title="Fewer cuts" onClick={() => { setCuts((c) => Math.max(1, c - 1)); setTaken([]) }} />
            <span className="w-10 text-center font-display text-2xl font-black">{cuts}</span>
            <IconButton name="plus" title="More cuts" onClick={() => { setCuts((c) => Math.min(11, c + 1)); setTaken([]) }} />
            <Chip color="teal">{slices} {shape === 'pizza' ? 'slices' : 'pieces'}</Chip>
          </div>

          <div className="flex items-center justify-center gap-4">
            <div className="text-center leading-none">
              <div className="font-display text-3xl font-black text-tomato">{taken.length}</div>
              <div className="my-1.5 h-1 rounded bg-ink" />
              <div className="font-display text-3xl font-black text-ink">{slices}</div>
            </div>
            <Kicker>{shape === 'pizza' ? 'of the pizza taken' : 'of the bar taken'}</Kicker>
          </div>
        </div>
      </Anvil>

      <Button
        color="tomato" size="lg" icon="hammer"
        disabled={!ready || locked}
        onClick={() => { if (soundOn) S.sStrike(); submitTemper(slices, taken.length) }}
      >
        BANG! Take {taken.length}/{slices}
      </Button>
      {ready
        ? <Coach text="Now BANG to check!" dir="up" tone="tomato" />
        : slices === wantD
          ? <Coach text={`Tap ${wantN} ${shape === 'pizza' ? 'slice' : 'piece'}${wantN === 1 ? '' : 's'} to take`} dir="up" tone="marigold" />
          : <Coach text={`Use the cuts to make ${wantD} ${shape === 'pizza' ? 'slices' : 'pieces'}`} dir="up" tone="marigold" />}
    </div>
  )
}

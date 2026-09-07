import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { useGame } from '../state/store'
import { unlockedOps, OP_LABEL, type Op } from '../engine/openforge'
import { openForgeTray } from '../engine/choices'
import { Orb, toneFor } from './Orb'
import { Coach } from './Coach'
import { Icon } from './Icon'
import { Button, Card, Chip, Kicker, Meter } from './ui'
import { BackToPlaying } from './BackToPlaying'

const OP_COLOUR: Record<Op, string> = {
  '+': 'bg-marigold', '-': 'bg-leaf', '×': 'bg-plum text-cream', '÷': 'bg-sky',
}

/**
 * "Make 24 any way you like."
 *
 * No single right answer, no clock, and the score is how many
 * *different* ways you find. Using an operation you have not tried on
 * this target yet pays the most, so the game is explicitly rewarding
 * breadth of thinking rather than repetition of one trick.
 */
export function OpenForge() {
  const ways = useRef<HTMLDivElement>(null)
  const open = useGame((s) => s.open)
  const states = useGame((s) => s.states)
  const setScreen = useGame((s) => s.setScreen)
  const start = useGame((s) => s.openStart)
  const press = useGame((s) => s.openKey)
  const setOp = useGame((s) => s.openSetOp)
  const setSlot = useGame((s) => s.openSetSlot)
  const submit = useGame((s) => s.openSubmit)

  const ops = unlockedOps(states)

  useEffect(() => { if (!open) start(false) }, [open, start])

  /*
    Keep the newest way in view inside its capped box.

    Above the early return, with every other hook. Below it this ran on
    the renders where there was a puzzle and not on the ones where there
    was not, so React counted a different number of hooks each time and
    tore the screen down: Your Way rendered blank whenever it was opened
    before the puzzle existed.
  */
  useEffect(() => {
    const box = ways.current
    if (box) box.scrollTop = box.scrollHeight
  }, [open?.ways.length])

  if (!open) return null

  const ready = open.a !== '' && open.b !== ''
  const fb = open.feedback

  const message =
    fb?.kind === 'goal' ? `That's ${open.goal}! You win a medal!`
    : fb?.kind === 'newOp' ? 'A brand new way! Nice thinking!'
    : fb?.kind === 'new' ? 'Yes! That works too!'
    : fb?.kind === 'dup' ? 'You found that one already. Try a different way!'
    : fb?.kind === 'uses-target' ? `Both numbers have to be something other than ${open.target}!`
    : fb?.kind === 'zero' ? 'Try numbers bigger than zero!'
    : fb?.kind === 'negative' ? 'That one goes below zero. Try another!'
    : fb?.kind === 'not-target' ? `That makes ${fb.value}. We want ${open.target}!`
    : null

  return (
    <div className="flex min-h-0 flex-1 flex-col px-6 pb-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 pt-4">

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-black tracking-tight">Your Way</h1>
          <span className="text-sm text-ink-mid">
            How many ways can you make it? There is no wrong answer here.
          </span>
          {/* Not the same as Back to playing at the foot of the page:
              that one returns to the current order, this one leaves for
              the menu. Two buttons that both said "Back" and went to
              different places was its own small lie. */}
          <Button className="ml-auto" size="sm" icon="home" onClick={() => setScreen('title')}>
            Main menu
          </Button>
        </div>

        {/*
          Side by side as early as the width allows. Stacked, the bench and
          the board of ways came to over a thousand pixels of column on an
          840px-wide window, which the fit had to shrink to about half size
          to get on screen. Two columns halve the height for free.
        */}
        <div className="grid gap-4 md:grid-cols-[1fr_300px]">
          {/* ── the bench ── */}
          <div className="flex flex-col gap-4">
            <Card className="flex flex-col items-center gap-4 px-5 py-6">
              <Kicker>Make this number</Kicker>
              <motion.div
                key={open.target}
                initial={{ scale: 0.4, rotate: -12 }}
                animate={{ scale: 1, rotate: -2 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="ink-thick hard-4 grid h-28 w-36 place-items-center rounded-blob bg-tomato"
              >
                <span className="font-display text-6xl font-black text-cream">{open.target}</span>
              </motion.div>

              {/* a ? b */}
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <Slot value={open.a} active={open.slot === 'a'} onClick={() => setSlot('a')} />
                <div className={`ink-thick hard-2 grid h-12 w-12 shrink-0 place-items-center rounded-2xl
                                 font-display text-2xl font-black sm:h-14 sm:w-14 sm:text-3xl
                                 ${OP_COLOUR[open.op]}`}>
                  {open.op}
                </div>
                <Slot value={open.b} active={open.slot === 'b'} onClick={() => setSlot('b')} />
                <span className="font-display text-2xl font-black text-ink-mid sm:text-3xl">=</span>
                <span className="font-display text-2xl font-black sm:text-3xl">{open.target}?</span>
              </div>

              {/* operation picker */}
              <div className="mt-1 flex flex-wrap justify-center gap-2">
                {ops.map((o) => (
                  <button
                    key={o}
                    onClick={() => setOp(o)}
                    className={`ink hard-1 pressable flex items-center gap-1.5 rounded-full px-3.5 py-1.5
                                font-display text-sm font-extrabold
                                ${open.op === o ? OP_COLOUR[o] : 'bg-card text-ink-mid'}`}
                  >
                    <span className="text-base">{o}</span> {OP_LABEL[o]}
                  </button>
                ))}
                {ops.length < 4 && (
                  <Chip><Icon name="star" size={13} /> more unlock as you learn</Chip>
                )}
              </div>

              <AnimatePresence mode="wait">
                {message && (
                  <motion.div
                    key={`${fb?.kind}-${open.found.length}`}
                    initial={{ opacity: 0, y: 8, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className={`ink hard-1 rounded-2xl px-4 py-2 font-display text-sm font-extrabold
                                ${fb?.kind === 'goal' ? 'bg-marigold'
                                  : fb?.kind === 'new' || fb?.kind === 'newOp' ? 'bg-leaf' : 'bg-tomato text-cream'}`}
                  >
                    {message}
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* number tray, no typing anywhere in the game */}
            <Card className="flex flex-col items-center gap-3 p-4 sm:p-5">
              <Coach
                text={open.a === '' ? 'Tap a number for the first box'
                      : open.b === '' ? 'Now tap a number for the second box'
                      : 'Ready! Hit BANG to check'}
                dir={open.a !== '' && open.b !== '' ? 'up' : 'down'}
                tone={open.a !== '' && open.b !== '' ? 'tomato' : 'marigold'}
              />
              <div className="flex max-w-2xl flex-wrap justify-center gap-2">
                {openForgeTray(open.target).map((n) => (
                  <Orb
                    key={n} value={n} size={52} tone={toneFor(n)} grab
                    onClick={() => press(String(n))}
                  />
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button color="tomato" size="lg" icon="hammer" disabled={!ready} onClick={submit}>
                  BANG!
                </Button>
                <Button size="sm" icon="undo" onClick={() => press('clear')}>Clear box</Button>
                <Button size="sm" icon="forward" onClick={() => start(true)}>New number</Button>
              </div>
            </Card>
          </div>

          {/* ── the board of ways found ── */}
          <Card className="flex flex-col gap-3 p-5">
            <div>
              <Kicker>Ways you found</Kicker>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-5xl font-black text-tomato">{open.found.length}</span>
                <span className="text-sm text-ink-mid">of {open.goal}</span>
                {open.goalHit && (
                  <span className="ml-auto"><Chip color="marigold">
                    <Icon name="star" size={13} /> medal won!
                  </Chip></span>
                )}
              </div>
              <Meter
                value={Math.min(1, open.found.length / open.goal)}
                color={open.goalHit ? 'marigold' : 'tomato'}
                className="mt-2"
              />
              {open.goalHit && (
                <p className="mt-2 text-xs leading-snug text-ink-mid">
                  Goal reached! Keep going, every extra way still earns sparks.
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(['+', '-', '×', '÷'] as Op[]).filter((o) => ops.includes(o)).map((o) => (
                <span
                  key={o}
                  className={`ink grid h-8 w-8 place-items-center rounded-full font-display text-base font-black
                              ${open.opsUsed.includes(o) ? OP_COLOUR[o] : 'bg-shade text-ink-dim'}`}
                >{o}</span>
              ))}
              <Kicker className="ml-1 self-center">ways used</Kicker>
            </div>

            {/*
              Capped and scrolled inside its own card. The list has no end
              to it, and every way a child finds is another row: left to
              grow it would push the page taller and taller and shrink the
              rest of the screen to make room for a history nobody is
              reading. The newest rows are the ones being added, so the
              box is kept scrolled to the bottom.
            */}
            <div ref={ways} className="scroll flex max-h-52 flex-col gap-2 pr-1">
              <AnimatePresence initial={false}>
                {open.ways.map((w, i) => (
                  <motion.div
                    key={`${w.a}${w.op}${w.b}`}
                    initial={{ opacity: 0, x: 26, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                    className={`ink hard-1 flex items-center gap-2 rounded-2xl px-3 py-2
                                font-display text-lg font-black ${OP_COLOUR[w.op]}`}
                  >
                    <span className="text-xs opacity-70">{i + 1}</span>
                    {w.a} {w.op} {w.b}
                    <Icon name="check" size={16} strokeWidth={3} className="ml-auto" />
                  </motion.div>
                ))}
              </AnimatePresence>
              {open.ways.length === 0 && (
                <p className="text-sm leading-snug text-ink-mid">
                  Pick two numbers and a way to join them. Then BANG!
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
      <BackToPlaying className="mt-6 pb-4" />
    </div>
  )
}

function Slot({ value, active, onClick }: { value: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`ink-thick hard-2 grid h-14 w-16 shrink-0 place-items-center rounded-2xl font-display
                  text-2xl font-black sm:h-16 sm:w-20 sm:text-3xl
                  ${active ? 'bg-marigold' : 'bg-card'}
                  ${active ? 'ring-4 ring-ink ring-offset-2 ring-offset-paper' : ''}`}
    >
      {value || <span className="text-ink-dim">?</span>}
    </button>
  )
}

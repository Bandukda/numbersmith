import { motion } from 'framer-motion'
import { useGame } from '../state/store'
import { GRADES, GRADE_LABEL } from '../engine/skills'
import { primeAudio, sTap } from '../audio/sound'
import { Icon } from './Icon'
import { Button, Card, Kicker } from './ui'
import type { Grade } from '../engine/types'

const PROMISES = [
  { icon: 'clock', color: 'bg-teal', title: 'Take your time', body: 'There is no clock. Nobody is rushing you.' },
  { icon: 'target', color: 'bg-marigold', title: 'It shows you how', body: 'Arrows point at what to do next, so you never get stuck.' },
  { icon: 'star', color: 'bg-plum text-cream', title: 'Light up your stars', body: 'Every skill you learn lights up a new star.' },
] as const

export function TitleScreen() {
  const start = useGame((s) => s.start)
  const gradeFilter = useGame((s) => s.gradeFilter)
  const setGradeFilter = useGame((s) => s.setGradeFilter)
  const playerName = useGame((s) => s.playerName)
  const setPlayerName = useGame((s) => s.setPlayerName)

  const begin = () => {
    primeAudio()
    start()
  }


  const bands: Array<{ key: string; label: string; g: Grade | null }> = [
    { key: 'auto', label: 'Surprise me!', g: null },
    ...GRADES.map((g) => ({ key: g, label: GRADE_LABEL[g], g })),
  ]

  return (
    <div className="flex-1 px-6 py-6">
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0, rotate: -25 }} animate={{ scale: 1, rotate: -6 }}
          transition={{ type: 'spring', stiffness: 220, damping: 14 }}
          className="ink-thick hard-4 bob grid h-24 w-24 place-items-center rounded-blob bg-marigold"
        >
          <Icon name="hammer" size={52} strokeWidth={2.6} />
        </motion.div>

        <motion.h1
          initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 200, damping: 20 }}
          className="mt-6 font-display text-[2.6rem] font-black tracking-tighter text-ink sm:text-6xl md:text-7xl"
        >
          NUMBERSMITH
        </motion.h1>

        <p className="mt-3 max-w-xl text-lg leading-snug text-ink-mid sm:text-xl">
          Add it! Subtract it! Multiply it! Divide it!
          <br />
          <strong className="text-ink">Guess your number, then BANG!</strong>
        </p>

        {/*
          Optional on purpose. A five-year-old may not be able to type yet,
          and a child who skips it should lose nothing but the name in the
          cheers, so nothing here gates the button below.
        */}
        <Kicker className="mt-8">What shall we call you?</Kicker>
        <input
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          maxLength={12}
          placeholder="Type your name"
          aria-label="Your name, if you want one"
          className="ink hard-2 mt-3 w-60 rounded-blob bg-card px-5 py-3 text-center
                     font-display text-xl font-black text-ink placeholder:font-extrabold
                     placeholder:text-ink/35 focus:outline-none focus:ring-4 focus:ring-marigold"
        />

        <Kicker className="mt-7">How big shall we go?</Kicker>
        <div className="mt-3 flex flex-wrap justify-center gap-2.5">
          {bands.map(({ key, label, g }) => {
            const on = gradeFilter === g
            return (
              <button
                key={key}
                onClick={() => { sTap(); setGradeFilter(g) }}
                className={`ink hard-1 pressable rounded-full px-4 py-2 font-display text-sm font-extrabold
                            ${on ? 'bg-tomato text-cream' : 'bg-card text-ink'}`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/*
          One way in. The other modes live in the top bar, where they are
          always reachable; three big buttons on the first screen made the
          child choose before they had anything to choose between.
        */}
        {/*
          The same words every time.

          It used to say "Let's play again!" once you had forged anything,
          which sounds friendly and is wrong more often than it is right.
          The count it read from is saved in the browser, so it survives
          closing the tab, and it belongs to the browser rather than to
          the child: a new player sitting down at a machine someone else
          has used is greeted as though they had been here before, and the
          same child on a different device is greeted as a stranger. The
          button cannot know, so it does not guess.
        */}
        <motion.div whileHover={{ scale: 1.04, rotate: -1 }} className="mt-9">
          <Button color="tomato" size="lg" icon="hammer" onClick={begin}>
            Let's play!
          </Button>
        </motion.div>

        <div className="mt-12 grid w-full gap-4 sm:grid-cols-3">
          {PROMISES.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ y: 22, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.08, type: 'spring', stiffness: 260, damping: 22 }}
            >
              <Card className="flex h-full flex-col items-center gap-2 px-4 py-5">
                <div className={`ink hard-1 grid h-12 w-12 place-items-center rounded-2xl ${p.color}`}>
                  <Icon name={p.icon} size={24} strokeWidth={2.6} />
                </div>
                <div className="mt-1 font-display text-base font-black">{p.title}</div>
                <div className="text-sm leading-snug text-ink-mid">{p.body}</div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

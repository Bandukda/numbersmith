import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { useGame, SKILL_BY_ID } from '../state/store'
import { plural } from '../engine/format'
import { didWhat } from '../engine/apprentice'
import { VERB_META } from '../engine/orders'
import { Pip, type PipMood } from './Pip'
import { Icon } from './Icon'
import { Button, Card, Chip, Kicker } from './ui'

/**
 * Teach Pip.
 *
 * The child watches Pip attempt a problem they already know, decides
 * whether Pip got it right, and if not, says what Pip did. Teaching is
 * the strongest form of knowing something, and this is the only place
 * in the game where the child does the diagnosing instead of the engine.
 */
/** The same sentence in the words the game uses everywhere else. */
function sentenceInWords(
  st: { a: number; b: number; op: '+' | '-' | '×' | '÷' }, given: number,
): string {
  switch (st.op) {
    case '+': return `${st.a} and ${st.b} make ${given}`
    case '-': return `${st.a} take away ${st.b} makes ${given}`
    case '×': return `${plural(st.a, 'row')} of ${st.b} makes ${given}`
    case '÷': return `${st.a} shared into ${st.b} makes ${given}`
  }
}

export function Apprentice() {
  const teach = useGame((s) => s.teach)
  const start = useGame((s) => s.teachStart)
  const verdict = useGame((s) => s.teachVerdict)
  const diagnose = useGame((s) => s.teachDiagnose)
  const setScreen = useGame((s) => s.setScreen)

  useEffect(() => { if (!teach) start() }, [])

  /* ── nothing to teach yet ── */
  if (!teach) {
    return (
      <div className="paper-dots grid min-h-0 flex-1 place-items-center px-6">
        <Card className="flex max-w-md flex-col items-center gap-4 p-8 text-center">
          <Pip mood="thinking" size={120} />
          <h2 className="font-display text-2xl font-black">Pip is waiting!</h2>
          <p className="text-base leading-snug text-ink-mid">
            You can only teach Pip things you are good at. Play a bit first,
            then come back and show Pip how it is done.
          </p>
          <Button color="tomato" icon="hammer" onClick={() => setScreen('forge')}>
            Go and practise
          </Button>
        </Card>
      </div>
    )
  }

  const { round, step } = teach
  const skill = SKILL_BY_ID[teach.skillId]!
  const meta = VERB_META[round.order.verb]
  const done = step === 'done'

  const mood: PipMood =
    step === 'verdict' ? 'thinking'
    : step === 'diagnose' ? 'sheepish'
    : teach.diagnosisOk || (teach.verdictOk && round.pipIsRight) ? 'proud'
    : 'sheepish'

  // What to say once the round is over.
  const outcome = !done ? null
    : round.pipIsRight && teach.verdictOk
      ? { good: true, title: 'Spot on!', body: 'Pip really did get it right. Great checking!' }
    : round.pipIsRight && !teach.verdictOk
      ? { good: false, title: 'Actually, Pip was right!', body: `${sentenceInWords(round.order.sentence, round.order.sentence.answer)}. Good of you to check though!` }
    : !teach.verdictOk
      ? { good: false, title: 'Have another look!', body: `Pip said ${round.given}, but the answer is ${round.order.sentence.answer}.` }
    : teach.diagnosisOk
      ? { good: true, title: 'You taught Pip!', body: `That is exactly it. Pip ${didWhat(round.bugId!)}. The answer is ${round.order.sentence.answer}.` }
      : { good: false, title: 'Close!', body: `Pip actually ${didWhat(round.bugId!)}. The answer is ${round.order.sentence.answer}.` }

  return (
    <div className="paper-dots scroll min-h-0 flex-1 px-6 pb-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 pt-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-black tracking-tight">Teach Pip</h1>
          <span className="text-sm text-ink-mid">You know this one. Can you help?</span>
          <Button className="ml-auto" size="sm" icon="back" onClick={() => setScreen('title')}>
            Back
          </Button>
        </div>

        <Card className="flex flex-col items-center gap-5 px-6 py-7">
          <Chip>{meta.name} · {skill.label}</Chip>

          {/* Pip and the speech bubble */}
          <div className="flex flex-wrap items-center justify-center gap-5">
            <Pip mood={mood} size={116} />
            <motion.div
              key={round.order.id + step}
              initial={{ scale: 0.85, opacity: 0, x: -12 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 22 }}
              className="ink-thick hard-3 relative rounded-blob bg-marigold px-6 py-4"
            >
              <Kicker>Pip says</Kicker>
              {/*
                Show the arithmetic sentence, not the order prompt. The
                prompt is an instruction ("Make a 5"), so pinning an answer
                onto it produced "Make a 5 = 6", which is not a sentence and
                gave the child nothing to actually check.
              */}
              <div className="mt-1.5 font-display text-4xl font-black leading-none text-ink">
                {round.order.sentence.a} {round.order.sentence.op} {round.order.sentence.b} = {round.given}
              </div>
              <div className="mt-2 font-display text-sm font-extrabold text-ink/70">
                {sentenceInWords(round.order.sentence, round.given)}
              </div>
            </motion.div>
          </div>

          {/*
            No AnimatePresence around the steps. They swap one for another,
            and a presence that has to finish exiting first can either
            leave the child with no question at all or keep the finished
            step mounted on top of the new one. The entry animations still
            play; only the exits go.
          */}
            {/* ── step 1: is Pip right? ── */}
            {step === 'verdict' && (
              <motion.div
                key="verdict"
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <h2 className="font-display text-2xl font-black">Is Pip right?</h2>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button color="leaf" size="lg" icon="check" onClick={() => verdict(false)}>
                    Yes, that's right!
                  </Button>
                  <Button color="tomato" size="lg" icon="bug" onClick={() => verdict(true)}>
                    Not quite!
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── step 2: what did Pip do? ── */}
            {step === 'diagnose' && (
              <motion.div
                key="diagnose"
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                className="flex w-full flex-col items-center gap-3"
              >
                <h2 className="font-display text-2xl font-black">What did Pip do?</h2>
                <div className="grid w-full gap-2.5">
                  {round.options.map((id, i) => (
                    <motion.button
                      key={id}
                      initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      whileHover={{ x: 4 }}
                      onClick={() => diagnose(id)}
                      className="ink-thick hard-2 pressable flex items-center gap-3 rounded-blob bg-card px-5 py-3.5
                                 text-left font-display text-base font-extrabold"
                    >
                      <span className="ink grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sky
                                       font-display text-sm font-black">
                        {String.fromCharCode(65 + i)}
                      </span>
                      Pip {didWhat(id)}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── the outcome ── */}
            {done && outcome && (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 16, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                className="flex w-full flex-col items-center gap-4"
              >
                <div className={`ink-thick hard-3 w-full rounded-blob px-6 py-4 text-center
                                 ${outcome.good ? 'bg-leaf' : 'bg-sky'}`}>
                  <div className="font-display text-2xl font-black">{outcome.title}</div>
                  <p className="mt-1.5 text-base leading-snug">{outcome.body}</p>
                  {teach.earned > 0 && (
                    <div className="mt-2 inline-block">
                      <Chip color="marigold">
                        <Icon name="star" size={14} /> +{teach.earned} sparks
                      </Chip>
                    </div>
                  )}
                </div>
                <Button color="tomato" size="lg" icon="forward" onClick={start}>
                  Teach Pip again
                </Button>
              </motion.div>
            )}
          
        </Card>
      </div>
    </div>
  )
}

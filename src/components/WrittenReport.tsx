import { AnimatePresence, motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { Button, Card, Kicker } from './ui'
import { Icon } from './Icon'
import { useGame } from '../state/store'
import { buildSnapshot, buildPrompt } from '../engine/report'
import { writeReport, hasKey, setKey, ReportError } from '../ai/deepseek'

/*
  The written summary, on the grown-ups' screen only.

  The numbers on this page say what a child has mastered; they do not say
  what to DO about it. A parent cannot read a mastery score, and the one
  question they actually have, "how is my child getting on?", is a
  language question. So this is the single place in the game where a
  language model earns its place: it turns the learner model into prose,
  and does no arithmetic, no grading and no teaching.
*/
export function WrittenReport() {
  const states = useGame((s) => s.states)
  const bugs = useGame((s) => s.bugs)
  const day = useGame((s) => s.day)
  const totalForges = useGame((s) => s.totalForges)
  const bestStreak = useGame((s) => s.bestStreak)

  const [text, setText] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [keyInput, setKeyInput] = useState('')
  const [showData, setShowData] = useState(false)
  const [ready, setReady] = useState(hasKey())
  const abort = useRef<AbortController | null>(null)

  const strategies = [...new Set(Object.values(states).flatMap((st) => st.strategies))]
  const snapshot = buildSnapshot(states, bugs, day, totalForges, bestStreak, strategies)
  const nothingYet = totalForges === 0

  const run = async () => {
    setBusy(true); setError(null); setText(null)
    abort.current?.abort()
    abort.current = new AbortController()
    try {
      setText(await writeReport(buildPrompt(snapshot), abort.current.signal))
    } catch (e) {
      setError(e instanceof ReportError ? e.message : 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Kicker className="mb-1">How your child is getting on</Kicker>
          <p className="max-w-lg text-sm leading-snug text-ink-mid">
            A written summary of everything on this page, in plain English.
          </p>
        </div>
        <Button
          color="plum" icon="clipboard"
          disabled={busy || nothingYet}
          onClick={run}
        >
          {busy ? 'Writing...' : text ? 'Write it again' : 'Write the summary'}
        </Button>
      </div>

      {nothingYet && (
        <p className="mt-4 text-sm text-ink-dim">
          Nothing to report yet. Play a few rounds first.
        </p>
      )}

      <AnimatePresence>
        {text && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="ink mt-4 rounded-2xl bg-shade p-4"
          >
            {text.split(/\n{2,}/).map((para, i) => (
              <p key={i} className="mb-2.5 text-[15px] leading-relaxed text-ink last:mb-0">
                {para.trim()}
              </p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="ink mt-4 rounded-2xl bg-tomato/15 p-3 text-sm font-bold text-ink">
          {error}
        </p>
      )}

      {/*
        A key pasted here stays in this browser. Offered because the env
        file only helps whoever is running the code, and a teacher trying
        this out is not going to edit a dotfile.
      */}
      {!ready && (
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="Paste a DeepSeek API key"
            aria-label="DeepSeek API key"
            className="ink hard-1 min-w-0 flex-1 rounded-2xl bg-card px-4 py-2.5 text-sm
                       placeholder:text-ink-dim focus:outline-none focus:ring-4 focus:ring-marigold"
          />
          <Button
            size="sm" color="card"
            onClick={() => { setKey(keyInput); setReady(hasKey()); setKeyInput('') }}
          >
            Save key
          </Button>
        </div>
      )}

      {/*
        Everything else in this game runs offline. This one button does
        not, so it says exactly what leaves the device and lets anyone
        read the payload before pressing anything.
      */}
      <div className="mt-4 border-t-2 border-ink/10 pt-3">
        <button
          onClick={() => setShowData((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-ink-dim"
        >
          <Icon name={showData ? 'minus' : 'plus'} size={12} strokeWidth={3} />
          {showData ? 'Hide' : 'See'} exactly what gets sent
        </button>
        {showData && (
          <>
            <p className="mt-2 text-xs leading-snug text-ink-mid">
              Sent to DeepSeek: the summary below. No name, no answers your child
              gave, nothing that identifies them. Everything else in Numbersmith
              stays on this device.
            </p>
            <pre className="ink mt-2 max-h-56 overflow-auto rounded-xl bg-shade p-3 text-[11px] leading-snug">
              {JSON.stringify(snapshot, null, 2)}
            </pre>
          </>
        )}
      </div>
    </Card>
  )
}

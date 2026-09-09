import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Button, Card, Kicker } from './ui'
import { Icon } from './Icon'
import { useGame } from '../state/store'
import { buildSnapshot, buildPrompt, personalise } from '../engine/report'
import { writeReport, hasKey, setKey, hasServer, getPassword, setPassword, ReportError } from '../ai/deepseek'

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
  const day = useGame((s) => s.day)
  const totalForges = useGame((s) => s.totalForges)
  const bestStreak = useGame((s) => s.bestStreak)
  const playerName = useGame((s) => s.playerName)

  const [text, setText] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [keyInput, setKeyInput] = useState('')
  const [server, setServer] = useState<boolean | null>(null)
  const [showData, setShowData] = useState(false)
  const [ready, setReady] = useState(hasKey() || !!getPassword())

  // A deployed site holds the key itself and wants a password instead.
  useEffect(() => {
    let alive = true
    void hasServer().then((v) => {
      if (!alive) return
      setServer(v)
      setReady(v ? !!getPassword() : hasKey())
    })
    return () => { alive = false }
  }, [])
  const abort = useRef<AbortController | null>(null)

  const strategies = [...new Set(Object.values(states).flatMap((st) => st.strategies))]
  const snapshot = buildSnapshot(states, day, totalForges, bestStreak, strategies)
  const nothingYet = totalForges === 0

  const save = () => {
    if (server) { setPassword(keyInput); setReady(!!getPassword()) }
    else { setKey(keyInput); setReady(hasKey()) }
    setKeyInput('')
    setError(null)
  }

  /**
   * Forget whichever secret this build is holding, so the gate comes back.
   *
   * Both paths need it. A deployed site remembers the password; a copy on
   * your own machine remembers a pasted API key, which is the more
   * sensitive of the two and had even less business being a one-way door.
   */
  const lock = () => {
    if (server) setPassword(''); else setKey('')
    setReady(false)
    setKeyInput('')
    setText(null)
    setError(null)
  }

  const run = async () => {
    setBusy(true); setError(null); setText(null)
    abort.current?.abort()
    abort.current = new AbortController()
    try {
      const written = await writeReport(buildPrompt(snapshot), abort.current.signal)
      setText(personalise(written, playerName))
    } catch (e) {
      setError(e instanceof ReportError ? e.message : 'Something went wrong. Try again.')
      if (server && !getPassword()) setReady(false)
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
      {/*
        Which secret this build needs depends on where it is running. A
        deployed site keeps the key on its server and asks for a password;
        a copy running on your own machine has no server, so it takes a
        key directly.
      */}
      {!ready && server !== null && (
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          {/*
            A shared passphrase for one feature, not an account login.
            Without saying so the browser offers saved credentials here
            and then asks whether to remember this as a password, which
            is a confusing thing to be asked on a page about a child's
            arithmetic.
          */}
          <input
            type="password"
            name="numbersmith-report-unlock"
            id="numbersmith-report-unlock"
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder={server ? 'Enter the password' : 'Paste a DeepSeek API key'}
            aria-label={server ? 'Password' : 'DeepSeek API key'}
            onKeyDown={(e) => { if (e.key === 'Enter') save() }}
            className="ink hard-1 min-w-0 flex-1 rounded-2xl bg-card px-4 py-2.5 text-sm
                       placeholder:text-ink-dim focus:outline-none focus:ring-4 focus:ring-marigold"
          />
          <Button size="sm" color="card" onClick={save}>
            {server ? 'Unlock' : 'Save key'}
          </Button>
        </div>
      )}

      {/*
        A way back out.

        The password is remembered in this browser so a parent does not
        have to retype it every time they want to read how their child is
        getting on. That is right for the person who owns the machine and
        wrong for every other case: a shared laptop, a classroom
        computer, a demo that needs to show the gate more than once. Until
        now there was no way to put it back, from anywhere in the app.
      */}
      {ready && server !== null && (
        <button
          onClick={lock}
          className="mt-3 font-display text-xs font-black uppercase tracking-wider
                     text-ink-dim underline decoration-2 underline-offset-2
                     hover:text-ink focus:outline-none focus:ring-4 focus:ring-marigold"
        >
          {server ? 'Lock this again' : 'Forget this key'}
        </button>
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
              Sent for summarising: the numbers below, and nothing else. No
              answers your child gave, and <strong className="text-ink">not even
              their name</strong>. The summary comes back with a blank where the
              name goes, and Numbersmith fills it in here on this device, so the
              report reads personally without the name ever being sent.
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

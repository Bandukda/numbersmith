import { SKILLS, GRADES, GRADE_LABEL } from '../engine/skills'
import { statusOf, currentMastery, freshState, summarise } from '../engine/mastery'
import { MISCONCEPTIONS } from '../engine/misconceptions'
import { strategyById } from '../engine/strategies'
import { useGame } from '../state/store'
import { Icon, type IconName } from './Icon'
import { Button, Card, Chip, Kicker, Meter } from './ui'

/**
 * The Grown-Up Forge Log, everything the engine knows, said plainly
 * to a parent or teacher. Including the part no points total can tell
 * you: the specific misconceptions this child has actually shown.
 */
export function Dashboard() {
  const states = useGame((s) => s.states)
  const day = useGame((s) => s.day)
  const sparks = useGame((s) => s.sparks)
  const ingots = useGame((s) => s.ingots)
  const bestStreak = useGame((s) => s.bestStreak)
  const bestWays = useGame((s) => s.bestWays)
  const taught = useGame((s) => s.taught)
  const setScreen = useGame((s) => s.setScreen)
  const advanceDays = useGame((s) => s.advanceDays)
  const resetAll = useGame((s) => s.resetAll)
  const seedDemo = useGame((s) => s.seedDemo)

  const sum = summarise(states, day)

  const byGrade = GRADES.map((g) => {
    const list = SKILLS.filter((s) => s.grade === g)
    const mastered = list.filter((s) => statusOf(s, states, day) === 'mastered').length
    const avg = list.reduce((n, s) => n + currentMastery(states[s.id] ?? freshState(), day), 0) / list.length
    return { g, total: list.length, mastered, avg }
  })

  const strategies = new Map<string, number>()
  for (const st of Object.values(states)) for (const s of st.strategies) strategies.set(s, (strategies.get(s) ?? 0) + 1)

  const fading = SKILLS.filter((s) => statusOf(s, states, day) === 'fading')

  return (
    <div className="paper-dots scroll min-h-0 flex-1 px-6 pb-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 pt-4">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="font-display text-3xl font-black tracking-tight">For Grown-Ups</h1>
          <span className="text-sm text-ink-mid">Day {day} of practice</span>
          <Button className="ml-auto" size="sm" icon="back" onClick={() => setScreen('forge')}>
            Back to playing
          </Button>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <Tile icon="star" bg="bg-marigold" label="Skills mastered" value={`${sum.mastered}`} sub={`of ${sum.total} traced`} />
          <Tile icon="check" bg="bg-leaf" label="Accuracy" value={`${Math.round(sum.accuracy * 100)}%`} sub={`${sum.correct}/${sum.attempts} turns`} />
          <Tile icon="clock" bg="bg-plum text-cream" label="Needs review" value={`${sum.fading}`} sub="mastery is fading" />
          <Tile icon="medal" bg="bg-teal" label="Medals" value={`${ingots}`} sub={`${sparks} sparks · streak ${bestStreak}`} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="p-5">
            <Kicker className="mb-3.5">Mastery by grade band</Kicker>
            <div className="flex flex-col gap-3">
              {byGrade.map(({ g, total, mastered, avg }) => (
                <div key={g}>
                  <div className="mb-1.5 flex justify-between font-display text-sm font-extrabold">
                    <span>{GRADE_LABEL[g]}</span>
                    <span className="text-ink-mid">{mastered}/{total} lit</span>
                  </div>
                  <Meter value={avg} color="marigold" height={11} />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <Kicker className="mb-1">Misconceptions detected</Kicker>
            <p className="mb-3.5 text-xs leading-snug text-ink-mid">
              Not "wrong answers". Named reasoning bugs, each already repaired in-game.
            </p>
            {sum.flags.length === 0 ? (
              <p className="text-sm text-ink-mid">None yet. They appear the moment one is spotted.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {sum.flags.slice(0, 6).map(([id, n]) => (
                  <div key={id} className="ink flex items-center gap-2.5 rounded-2xl bg-teal px-3 py-2">
                    <Icon name="radar" size={17} strokeWidth={2.6} />
                    <span className="flex-1 font-display text-sm font-extrabold leading-tight">
                      {MISCONCEPTIONS[id]?.label ?? id}
                    </span>
                    <span className="font-display text-xs font-black">×{n}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <Kicker className="mb-1">Spaced review queue</Kicker>
            <p className="mb-3.5 text-xs leading-snug text-ink-mid">
              Mastery has decayed below threshold. The engine serves these first.
            </p>
            {fading.length === 0 ? (
              <p className="text-sm text-ink-mid">Nothing due. Everything practised is still fresh.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {fading.map((s) => (
                  <Chip key={s.id} color="plum">
                    {s.label} · {Math.round(currentMastery(states[s.id] ?? freshState(), day) * 100)}%
                  </Chip>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card className="p-5">
          <div className="mb-1 flex items-baseline gap-3">
            <Kicker>Strategy repertoire</Kicker>
            {bestWays > 0 && (
              <Chip color="marigold">best Open Forge haul: {bestWays} ways</Chip>
            )}
            {taught > 0 && (
              <Chip color="plum">taught Pip {taught} time{taught === 1 ? '' : 's'}</Chip>
            )}
          </div>
          <p className="mb-3.5 text-xs leading-snug text-ink-mid">
            Distinct methods demonstrated. Breadth here predicts fluency far better than speed does.
          </p>
          {strategies.size === 0 ? (
            <p className="text-sm text-ink-mid">No strategy tokens claimed yet.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {[...strategies.entries()].sort((a, b) => b[1] - a[1]).map(([id, n]) => (
                <div key={id} className="flex items-center gap-2.5">
                  <Icon name="star" size={15} />
                  <span className="flex-1 font-display text-sm font-extrabold">{strategyById(id)?.label ?? id}</span>
                  <span className="text-xs text-ink-mid">on {n} skill{n === 1 ? '' : 's'}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card tone="shade" className="flex flex-wrap items-center gap-3.5 p-5">
          <div className="min-w-56 flex-1">
            <Kicker>Demo controls</Kicker>
            <p className="mt-1 text-xs leading-snug text-ink-mid">
              Load a player with a few weeks of history, or fast-forward the forgetting
              curve to watch mastery decay and the review queue fill.
            </p>
          </div>
          <Button color="marigold" icon="star" onClick={seedDemo}>Load demo player</Button>
          <Button size="sm" icon="clock" onClick={() => advanceDays(7)}>Simulate a week</Button>
          <Button size="sm" icon="clock" onClick={() => advanceDays(30)}>Simulate a month</Button>
          <Button size="sm" icon="undo" color="tomato" onClick={resetAll}>Reset player</Button>
        </Card>
      </div>
    </div>
  )
}

function Tile({ icon, bg, label, value, sub }: {
  icon: IconName; bg: string; label: string; value: string; sub: string
}) {
  return (
    <Card className="flex items-center gap-3.5 p-4">
      <div className={`ink hard-1 grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${bg}`}>
        <Icon name={icon} size={23} strokeWidth={2.6} />
      </div>
      <div className="min-w-0">
        <Kicker>{label}</Kicker>
        <div className="font-display text-3xl font-black leading-none">{value}</div>
        <div className="mt-1 truncate text-xs text-ink-mid">{sub}</div>
      </div>
    </Card>
  )
}

import { motion } from 'framer-motion'
import { HEROES, isUnlocked, unlockHint } from '../engine/heroes'
import { HeroArt } from './HeroArt'
import { useGame } from '../state/store'
import { Kicker } from './ui'
import { Icon } from './Icon'
import * as S from '../audio/sound'

/*
  Choosing who cheers you on.

  This is the part that makes the roster more than a shelf of trophies.
  Collecting is an extrinsic reward and the research on children is blunt
  about those: a prize for something already interesting reduces the
  wanting. Choosing is not a prize. It hands the child a say in their own
  game, which is the one thing that reliably deepens motivation rather
  than replacing it.

  Locked heroes are shown, not hidden. A silhouette with "get 5 right in
  a row" underneath is a goal; an empty space is nothing at all.
*/
export function HeroPicker() {
  const bestStreak = useGame((s) => s.bestStreak)
  const ingots = useGame((s) => s.ingots)
  const bugs = useGame((s) => s.bugs)
  const activeHero = useGame((s) => s.activeHero)
  const setActiveHero = useGame((s) => s.setActiveHero)
  const soundOn = useGame((s) => s.soundOn)

  const caught = Object.values(bugs).filter((b) => b.caught).length
  const open = HEROES.filter((h) => isUnlocked(h, bestStreak, ingots, caught))

  return (
    <div className="paper-dots scroll flex min-h-0 flex-1 flex-col items-center px-4 py-5">
      <h1 className="font-display text-3xl font-black tracking-tight">My Heroes</h1>
      <p className="mt-1 max-w-md text-center text-sm leading-snug text-ink-mid">
        Pick who cheers you on. More join you as you get things right.
      </p>
      <Kicker className="mt-3">{open.length} of {HEROES.length} have joined</Kicker>

      <div className="mt-5 grid w-full max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {HEROES.map((h) => {
          const unlocked = isUnlocked(h, bestStreak, ingots, caught)
          const picked = activeHero === h.id
          return (
            <motion.button
              key={h.id}
              disabled={!unlocked}
              whileTap={unlocked ? { scale: 0.96 } : undefined}
              onClick={() => { if (soundOn) S.sTap(); setActiveHero(h.id) }}
              className={`ink hard-2 flex flex-col items-center rounded-blob p-2.5
                          ${picked ? 'bg-marigold' : unlocked ? 'bg-card' : 'bg-shade'}`}
            >
              <div className={unlocked ? '' : 'opacity-25 grayscale'}>
                <HeroArt hero={h} landed size={78} />
              </div>
              <div className="mt-1 text-center font-display text-[13px] font-black leading-tight">
                {unlocked ? h.name : '???'}
              </div>
              {unlocked ? (
                <div className="mt-0.5 text-center text-[10px] leading-snug text-ink-mid">
                  {picked ? 'Cheering for you' : h.power}
                </div>
              ) : (
                <div className="mt-0.5 flex items-center gap-1 text-center text-[10px] font-black text-ink-dim">
                  <Icon name="star" size={9} /> {unlockHint(h)}
                </div>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

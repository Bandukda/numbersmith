import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from '../state/store'
import { setAudioEnabled } from '../audio/sound'
import { Icon } from './Icon'
import { Chip, IconButton, Tip } from './ui'

export function TopBar() {
  const screen = useGame((s) => s.screen)
  const setScreen = useGame((s) => s.setScreen)
  const sparks = useGame((s) => s.sparks)
  const ingots = useGame((s) => s.ingots)
  const streak = useGame((s) => s.streak)
  const soundOn = useGame((s) => s.soundOn)
  const toggleSound = useGame((s) => s.toggleSound)
  const openStart = useGame((s) => s.openStart)
  const teachStart = useGame((s) => s.teachStart)
  const heroToMeet = useGame((s) => s.heroToMeet)

  const toggles = (
    <IconButton
      name={soundOn ? 'sound-on' : 'sound-off'} active={soundOn}
      title={soundOn ? 'Sound is on. Tap to mute' : 'Sound is off. Tap to unmute'}
      onClick={() => { setAudioEnabled(!soundOn); toggleSound() }}
    />
  )

  if (screen === 'title') {
    return <div className="flex justify-end gap-2 p-4">{toggles}</div>
  }

  return (
    <div className="ink-thick flex flex-wrap items-center gap-2 border-x-0 border-t-0 bg-tomato px-2.5 py-2 sm:gap-3 sm:px-5 sm:py-3">
      <Tip label="Main menu">
        <button
          onClick={() => setScreen('title')}
          aria-label="Main menu"
          className="flex h-9 items-center gap-2 font-display text-base font-black tracking-tight text-cream sm:h-10 sm:gap-2.5 sm:text-xl"
        >
          <Icon name="hammer" size={26} strokeWidth={2.8} />
          NUMBERSMITH
        </button>
      </Tip>

      <div className="flex flex-wrap gap-1.5 sm:ml-3 sm:gap-2">
        {/*
          These two counters mean different things and looked like the same
          kind of badge, so neither said what it was. Stars are spent on
          hints; medals cannot be bought at all.
        */}
        <Tip label="Stars. Spend them on hints">
          <motion.div key={sparks} initial={{ scale: 1.22 }} animate={{ scale: 1 }}>
            <Chip color="marigold">
              <Icon name="star" size={15} /> {sparks}
            </Chip>
          </motion.div>
        </Tip>
        <Tip label="Medals. One for every skill you master">
          <motion.div key={`i${ingots}`} initial={{ scale: 1.22 }} animate={{ scale: 1 }}>
            <Chip>
              <Icon name="medal" size={18} strokeWidth={2.6} /> {ingots}
            </Chip>
          </motion.div>
        </Tip>
        {streak > 1 && (
          <Tip label={`${streak} right in a row!`}>
            <motion.div initial={{ scale: 0.5, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}>
              <Chip color="plum"><Icon name="flame" size={15} strokeWidth={2.6} /> {streak}</Chip>
            </motion.div>
          </Tip>
        )}
      </div>

      <div className="ml-auto flex flex-wrap justify-end gap-1 sm:gap-2">
        <IconButton
          name="home" title="Main menu"
          onClick={() => setScreen('title')}
        />
        <IconButton
          name="map" title="My Star Map: skills you have lit up"
          color={screen === 'constellation' ? 'marigold' : 'card'}
          onClick={() => setScreen(screen === 'constellation' ? 'forge' : 'constellation')}
        />
        <IconButton
          name="pip" title="Teach Pip: spot his mistake"
          color={screen === 'teach' ? 'marigold' : 'card'}
          onClick={() => (screen === 'teach' ? setScreen('forge') : teachStart())}
        />
        <IconButton
          name="ways" title="Your Way: make a number lots of ways"
          color={screen === 'open' ? 'marigold' : 'card'}
          onClick={() => (screen === 'open' ? setScreen('forge') : openStart(false))}
        />
        {/*
          The way to the new hero.

          A hero unlocking is the biggest thing that happens in the game,
          and the child was told about it in the middle of the screen
          while the button that actually opens the roster sat unmarked in
          a row of seven identical buttons at the top. The banner said a
          hero had arrived; nothing said where to find them.

          So the button marks itself, and keeps marking itself until the
          child has been. It does not time out and it survives a reload,
          because a five-year-old who taps Next task instead is not
          declining the invitation, they just have not got there yet.
        */}
        <div className="relative">
          <IconButton
            name="pip" title="My Heroes: pick who cheers you on"
            color={screen === 'heroes' ? 'marigold' : heroToMeet ? 'marigold' : 'card'}
            onClick={() => setScreen(screen === 'heroes' ? 'forge' : 'heroes')}
          />
          {/*
            One element, not two side by side. AnimatePresence can only
            track children it can key, and a fragment holding the ring and
            the arrow is not one of those: the exit never completed and
            the arrow stayed on screen pointing at nothing long after the
            child had been to meet the hero. So both live inside a single
            keyed box that exactly overlays the button, which leaves them
            positioned as before and gives the exit something to hold on to.
          */}
          <AnimatePresence>
            {heroToMeet && screen !== 'heroes' && (
              <motion.div
                key="hero-pointer"
                className="pointer-events-none absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.18 } }}
              >
                {/* a ring that keeps pulsing out of the button */}
                <motion.span
                  className="absolute inset-0 rounded-2xl border-4 border-cream"
                  animate={{ opacity: [0.9, 0, 0.9], scale: [1, 1.55, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                />
                {/*
                  The arrow hangs below the bar rather than inside it, so
                  it points at the button from the open paper underneath
                  instead of crowding a row of seven. Nothing else is there.
                */}
                <motion.div
                  className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-1.5"
                  initial={{ y: -8, scale: 0.7 }}
                  animate={{ y: [0, 6, 0], scale: 1 }}
                  transition={{
                    scale: { type: 'spring', stiffness: 380, damping: 22 },
                    y: { duration: 1.1, repeat: Infinity, ease: 'easeInOut' },
                  }}
                >
                  <div className="flex flex-col items-center">
                    <Icon name="back" size={22} strokeWidth={3.2}
                          className="rotate-90 text-tomato drop-shadow-[0_2px_0_var(--color-ink)]" />
                    <span className="ink hard-1 -mt-0.5 whitespace-nowrap rounded-full bg-marigold
                                     px-2.5 py-1 font-display text-[11px] font-black text-ink">
                      New hero!
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <IconButton
          name="clipboard" title="For Grown-Ups: progress and reports"
          color={screen === 'dashboard' ? 'marigold' : 'card'}
          onClick={() => setScreen(screen === 'dashboard' ? 'forge' : 'dashboard')}
        />
        {toggles}
      </div>
    </div>
  )
}

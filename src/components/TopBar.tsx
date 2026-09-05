import { motion } from 'framer-motion'
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
        <IconButton
          name="jar" title="My Bug Jar: creatures you have caught"
          color={screen === 'bugs' ? 'marigold' : 'card'}
          onClick={() => setScreen(screen === 'bugs' ? 'forge' : 'bugs')}
        />
        <IconButton
          name="pip" title="My Heroes: pick who cheers you on"
          color={screen === 'heroes' ? 'marigold' : 'card'}
          onClick={() => setScreen(screen === 'heroes' ? 'forge' : 'heroes')}
        />
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

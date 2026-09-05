import { AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { useGame } from './state/store'
import { TopBar } from './components/TopBar'
import { TitleScreen } from './components/TitleScreen'
import { ForgeScreen } from './components/ForgeScreen'
import { Constellation } from './components/Constellation'
import { Dashboard } from './components/Dashboard'
import { OpenForge } from './components/OpenForge'
import { Apprentice } from './components/Apprentice'
import { RepairScene } from './components/RepairScene'
import { StrategyPicker } from './components/StrategyPicker'
import { HeroPicker } from './components/HeroPicker'
import { setAudioEnabled, armAudioOnFirstGesture } from './audio/sound'

export default function App() {
  const screen = useGame((s) => s.screen)
  const phase = useGame((s) => s.phase)
  const soundOn = useGame((s) => s.soundOn)

  useEffect(() => { armAudioOnFirstGesture() }, [])
  useEffect(() => { setAudioEnabled(soundOn) }, [soundOn])

  return (
    <>
      <div className="flex h-full flex-col bg-paper">
        <TopBar />
        {screen === 'title' && <TitleScreen />}
        {screen === 'forge' && <ForgeScreen />}
        {screen === 'constellation' && <Constellation />}
        {screen === 'heroes' && <HeroPicker />}
        {screen === 'open' && <OpenForge />}
        {screen === 'teach' && <Apprentice />}
        {screen === 'dashboard' && <Dashboard />}
      </div>

      <AnimatePresence>
        {screen === 'forge' && phase === 'repair' && <RepairScene key="repair" />}
        {screen === 'forge' && phase === 'strategy' && <StrategyPicker key="strategy" />}
      </AnimatePresence>
    </>
  )
}

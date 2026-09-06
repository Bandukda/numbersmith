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
import { SparkleTrail } from './components/SparkleTrail'
import { FitToViewport } from './components/FitToViewport'
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
        <SparkleTrail />
        <TopBar />
        {/*
          Everything the child plays with is held inside the window, so a
          screen never scrolls and the button that carries on is never
          below the fold.

          For Grown-Ups is the one exception. It is a document rather than
          a screen: a wall of small print with a written report of unknown
          length in the middle of it, and shrinking that to fit would only
          make it unreadable. Documents are allowed to scroll, and the
          adult reading it knows how.
        */}
        {screen === 'dashboard' ? (
          <Dashboard />
        ) : (
          <FitToViewport dots={screen !== 'title'}>
            {screen === 'title' && <TitleScreen />}
            {screen === 'forge' && <ForgeScreen />}
            {screen === 'constellation' && <Constellation />}
            {screen === 'heroes' && <HeroPicker />}
            {screen === 'open' && <OpenForge />}
            {screen === 'teach' && <Apprentice />}
          </FitToViewport>
        )}
      </div>

      <AnimatePresence>
        {screen === 'forge' && phase === 'repair' && <RepairScene key="repair" />}
        {screen === 'forge' && phase === 'strategy' && <StrategyPicker key="strategy" />}
      </AnimatePresence>
    </>
  )
}

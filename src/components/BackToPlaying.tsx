import { Button } from './ui'
import { useGame } from '../state/store'

/*
  The way back to the game, from any screen that is not the game.

  The top bar can take you back, but its buttons are small icons a child
  has to already understand. A big labelled button that says what it does
  is the difference between a child who can leave a screen on their own
  and one who calls a grown-up over.

  It lives in its own file rather than in ui.tsx because it reaches into
  the store, and ui.tsx is imported by nearly everything, including code
  the tests bundle for Node.
*/
export function BackToPlaying({ className = '' }: { className?: string }) {
  const setScreen = useGame((s) => s.setScreen)
  return (
    <div className={`flex justify-center ${className}`}>
      <Button color="teal" size="lg" icon="back" onClick={() => setScreen('forge')}>
        Back to playing
      </Button>
    </div>
  )
}

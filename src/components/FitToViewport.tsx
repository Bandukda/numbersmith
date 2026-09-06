import { useCallback, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'

/*
  Keeps a whole screen inside the window.

  The forge grows and shrinks as a turn goes on: answering right brings in
  the hero, his cloud and the Next task button all at once, which on a
  1280x720 laptop pushed the column 283px past the bottom of the window.
  The child had answered correctly and then had to scroll to find the
  button that carried on. A five-year-old will not scroll. They will sit
  there looking at a screen that appears to have stopped.

  Nothing here is allowed to move or clip to make room. The screen is
  measured at full size and then zoomed out as a whole, the way you would
  step back from something too big to see at once, so every piece keeps
  its place and its proportions and simply gets smaller together. On a
  window tall enough for the content nothing is scaled at all.
*/

/*
  Below this the words would be too small to read, so the scaling stops
  and the bottom of the screen is clipped instead. It takes a window under
  roughly 420px tall to reach it, which is a phone held sideways with the
  browser bars up.
*/
const FLOOR = 0.45

/* How long to keep re-measuring after a change, in ms. Long enough to
   outlast the springs that animate the rows open and shut. */
const SETTLE = 420

export function FitToViewport({ children, dots = true }: { children: ReactNode; dots?: boolean }) {
  const frame = useRef<HTMLDivElement>(null)
  const sheet = useRef<HTMLDivElement>(null)
  const scale = useRef(1)

  /**
   * Measure, then zoom. Returns the scale it settled on so the caller can
   * tell whether anything is still moving.
   */
  const fit = useCallback((): number => {
    const box = frame.current
    const page = sheet.current
    if (!box || !page) return scale.current

    const room = box.clientHeight
    if (room <= 0) return scale.current

    /*
      Measure with the zoom off and the page held to exactly the height of
      the window. A transform does not change layout, so leaving it on
      would have no effect on the numbers, but turning it off keeps this
      honest if that ever stops being true. Holding the height to the
      window is what matters: the stage inside grows to fill whatever it
      is given, so the page has to be given the real thing for
      scrollHeight to come back as the height the content actually needs.
    */
    page.style.transform = 'none'
    page.style.height = `${room}px`
    const wanted = page.scrollHeight

    const next = wanted > room ? Math.max(FLOOR, room / wanted) : 1

    /*
      Give the page the taller box it asked for and shrink it back down to
      the window. At the scale we just worked out those two are the same
      number, so the result fills the window exactly rather than leaving a
      band of empty paper underneath.
    */
    page.style.height = `${Math.ceil(room / next)}px`
    page.style.transform = next === 1 ? 'none' : `scale(${next})`

    scale.current = next
    return next
  }, [])

  /*
    Re-measure after every render, then keep going for a moment.

    One measurement is never enough. The rows arrive on springs, so the
    height at the instant React finishes rendering is the height before
    the animation has moved anything. This watches until the scale has
    held still for SETTLE ms and then stops, so an idle screen costs
    nothing.
  */
  useLayoutEffect(() => {
    let alive = true
    let raf = 0
    let last = fit()
    let steady = performance.now()

    const tick = (now: number) => {
      if (!alive) return
      const s = fit()
      if (s !== last) { last = s; steady = now }
      if (now - steady < SETTLE) raf = requestAnimationFrame(tick)
      else raf = 0
    }
    raf = requestAnimationFrame(tick)

    return () => { alive = false; if (raf) cancelAnimationFrame(raf) }
  })

  /* A resized window changes the room available, which changes everything. */
  useEffect(() => {
    const box = frame.current
    if (!box) return
    const ro = new ResizeObserver(() => fit())
    ro.observe(box)
    window.addEventListener('resize', fit)
    return () => { ro.disconnect(); window.removeEventListener('resize', fit) }
  }, [fit])

  return (
    /*
      The paper texture lives out here rather than on the page inside, so
      it stays the same size whatever the zoom is doing and reaches the
      edges of the window. Scaled with the page it would have shrunk into
      a dotted panel with plain bands down either side.
    */
    <div
      ref={frame}
      className={`relative min-h-0 flex-1 overflow-hidden ${dots ? 'paper-dots' : ''}`}
    >
      <div
        ref={sheet}
        className="absolute inset-x-0 top-0 flex flex-col"
        style={{ transformOrigin: 'top center' }}
      >
        {children}
      </div>
    </div>
  )
}

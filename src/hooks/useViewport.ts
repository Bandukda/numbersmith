import { useEffect, useState } from 'react'

/**
 * Viewport width, for the few places that must size real pixels
 * (a grid of fixed-size cells) rather than lean on CSS.
 */
export function useViewportWidth(): number {
  return useViewport().w
}

/** Both dimensions: a short-but-wide window needs sizing too. */
export function useViewport(): { w: number; h: number } {
  const [size, setSize] = useState(() =>
    typeof window === 'undefined'
      ? { w: 1024, h: 768 }
      : { w: window.innerWidth, h: window.innerHeight },
  )
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

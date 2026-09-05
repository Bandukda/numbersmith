/**
 * The icon set.
 *
 * Hand-drawn as a single consistent family: 24px grid, 2.4 stroke,
 * round caps and joins, no fills unless the shape needs mass. Emoji
 * were the single biggest tell that the old UI was machine-made, * they carry another designer's style, at another optical weight,
 * in another palette.
 */

export type IconName =
  | 'hammer' | 'star' | 'flame' | 'medal'
  | 'sound-on' | 'sound-off' | 'voice-on' | 'voice-off' | 'speak'
  | 'map' | 'clipboard' | 'back' | 'forward'
  | 'plus' | 'minus' | 'check' | 'undo' | 'clock'
  | 'fuse' | 'cleave' | 'stamp' | 'share' | 'temper'
  | 'radar' | 'bulb' | 'target' | 'bug' | 'jar'
  | 'pip' | 'read-aloud' | 'read-aloud-off' | 'home' | 'ways'

interface Props {
  name: IconName
  size?: number
  className?: string
  strokeWidth?: number
}

export function Icon({ name, size = 24, className = '', strokeWidth = 2.4 }: Props) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  )
}

const PATHS: Record<IconName, React.ReactNode> = {
  hammer: <><path d="M3.5 20.5l7-7" /><path d="M13.2 2.8l8 8-3.4 3.4-8-8z" /></>,
  star: <path d="M12 2.6l2.7 6.4 6.9.6-5.2 4.5 1.6 6.7L12 17.2 6 20.8l1.6-6.7L2.4 9.6l6.9-.6z" fill="currentColor" stroke="none" />,
  flame: <path d="M12 2.6s5.6 4.3 5.6 9.2a5.6 5.6 0 11-11.2 0c0-2 1.2-3.6 2.4-4.8 0 2 1.1 3 2 3 1.6 0 1.2-4.6 1.2-7.4z" />,
  medal: <><path d="M8.9 2.2l2.1 4.9" /><path d="M15.1 2.2l-2.1 4.9" /><circle cx="12" cy="14.9" r="7.1" /><path d="M12.00 11.00 L13.01 13.51 L15.71 13.69 L13.64 15.43 L14.29 18.06 L12.00 16.62 L9.71 18.06 L10.36 15.43 L8.29 13.69 L10.99 13.51 Z" fill="currentColor" stroke="none" /></>,

  'sound-on': <><path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z" /><path d="M16 9a4.2 4.2 0 010 6" /><path d="M18.8 6.4a8 8 0 010 11.2" /></>,
  'sound-off': <><path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z" /><path d="M16.5 9.8l4.5 4.4M21 9.8l-4.5 4.4" /></>,
  'voice-on': <><path d="M12 3.2a2.7 2.7 0 012.7 2.7v5.4a2.7 2.7 0 01-5.4 0V5.9A2.7 2.7 0 0112 3.2z" /><path d="M6 11a6 6 0 0012 0" /><path d="M12 17v3.6" /></>,
  'voice-off': <><path d="M12 3.2a2.7 2.7 0 012.7 2.7v4" /><path d="M9.3 9v2.3a2.7 2.7 0 004.2 2.2" /><path d="M6 11a6 6 0 009.2 5.1M12 17v3.6" /><path d="M4 3.6l16 16.8" /></>,
  speak: <><path d="M20.4 14.6a2 2 0 01-2 2H8.6l-4 3.4V5.4a2 2 0 012-2h11.8a2 2 0 012 2z" /><path d="M8.4 8.6h7.2M8.4 12h4.6" /></>,

  map: <><path d="M4.4 16.6L9 9.4l5.2 3.4 5-8" /><circle cx="4.4" cy="16.6" r="1.9" fill="currentColor" stroke="none" /><circle cx="9" cy="9.4" r="1.9" fill="currentColor" stroke="none" /><circle cx="14.2" cy="12.8" r="1.9" fill="currentColor" stroke="none" /><circle cx="19.2" cy="4.8" r="1.9" fill="currentColor" stroke="none" /></>,
  clipboard: <><rect x="4.6" y="4.4" width="14.8" height="16.2" rx="2.4" /><path d="M9 4.4V3.2h6v1.2" /><path d="M8.6 10.4h6.8M8.6 14.4h4.6" /></>,
  back: <><path d="M20 12H4.6" /><path d="M10.4 5.8L4.2 12l6.2 6.2" /></>,
  forward: <><path d="M4 12h15.4" /><path d="M13.6 5.8L19.8 12l-6.2 6.2" /></>,

  plus: <><path d="M12 5v14M5 12h14" /></>,
  minus: <path d="M5 12h14" />,
  check: <path d="M4.6 12.6l4.8 4.8L19.4 7.2" />,
  undo: <><path d="M4 9.4h7.4a5.4 5.4 0 110 10.8H6.6" /><path d="M7.4 5.4L3.4 9.4l4 4" /></>,
  clock: <><circle cx="12" cy="12" r="8.6" /><path d="M12 7.2V12l3.4 2.2" /></>,

  fuse: <><circle cx="8.6" cy="12" r="5.2" /><circle cx="15.4" cy="12" r="5.2" /></>,
  cleave: <><path d="M12 3v18" /><path d="M4.4 6.6h4.4v10.8H4.4zM15.2 6.6h4.4v10.8h-4.4z" /></>,
  stamp: <><rect x="3.6" y="3.6" width="6.4" height="6.4" rx="1.6" /><rect x="14" y="3.6" width="6.4" height="6.4" rx="1.6" /><rect x="3.6" y="14" width="6.4" height="6.4" rx="1.6" /><rect x="14" y="14" width="6.4" height="6.4" rx="1.6" /></>,
  share: <><path d="M12 3.4v6.2" /><path d="M12 9.6L5.4 15M12 9.6L18.6 15" /><path d="M3.4 15h4v5.6h-4zM10 15h4v5.6h-4zM16.6 15h4v5.6h-4z" /></>,
  temper: <><rect x="3" y="7.6" width="18" height="8.8" rx="2" /><path d="M9 7.6v8.8M15 7.6v8.8" /></>,

  radar: <><circle cx="12" cy="12" r="8.6" /><circle cx="12" cy="12" r="4.4" /><circle cx="12" cy="12" r="1" fill="currentColor" /></>,
  bulb: <><path d="M9.2 17.4a5.8 5.8 0 115.6 0v2.2H9.2z" /><path d="M10 21.4h4" /></>,
  target: <><circle cx="12" cy="12" r="8.6" /><circle cx="12" cy="12" r="4" /><path d="M12 3.4v3M12 17.6v3M3.4 12h3M17.6 12h3" /></>,
  bug: <><ellipse cx="12" cy="13.6" rx="5.6" ry="6.4" /><path d="M9 6.4L7 3.4M15 6.4l2-3M6.4 11H3.2M17.6 11h3.2M6.4 16.4l-3 2M17.6 16.4l3 2" /></>,
  jar: <><path d="M7 8.4h10v9.8a2.6 2.6 0 01-2.6 2.6H9.6A2.6 2.6 0 017 18.2z" /><path d="M8.4 8.4V5.2a1.4 1.4 0 011.4-1.4h4.4a1.4 1.4 0 011.4 1.4v3.2" /><path d="M7 12.2h10" /></>,
  /* Pip's own face, so "Teach Pip" is not a microphone. */
  /* Many routes to one place: the Your Way mode. */
  ways: <><path d="M12 20.4V13" /><path d="M12 13L5.2 6.4M12 13l6.8-6.6" /><circle cx="12" cy="21.4" r="1.8" fill="currentColor" stroke="none" /><circle cx="4.4" cy="5.4" r="1.8" fill="currentColor" stroke="none" /><circle cx="19.6" cy="5.4" r="1.8" fill="currentColor" stroke="none" /></>,
  home: <><path d="M3.4 11L12 3.6l8.6 7.4" /><path d="M5.6 9.6v9a1.6 1.6 0 001.6 1.6h9.6a1.6 1.6 0 001.6-1.6v-9" /><path d="M9.8 20.2v-5.4h4.4v5.4" /></>,
  pip: <><path d="M5.4 7.4q6.6 -4.6 13.2 0" /><path d="M4.2 7.4h15.6" /><rect x="5.6" y="7.4" width="12.8" height="10.6" rx="3.6" /><circle cx="10" cy="12.6" r="1.3" fill="currentColor" stroke="none" /><circle cx="14" cy="12.6" r="1.3" fill="currentColor" stroke="none" /></>,
  /* Speech OUT, not a microphone: the game talks, it never listens. */
  'read-aloud': <><path d="M14.6 15.2a2 2 0 01-2 2H7.4l-3.4 2.8V6.6a2 2 0 012-2h6.6a2 2 0 012 2z" /><path d="M17.6 9.2a3.6 3.6 0 010 5.6" /><path d="M20.2 6.8a7 7 0 010 10.4" /></>,
  'read-aloud-off': <><path d="M14.6 15.2a2 2 0 01-2 2H7.4l-3.4 2.8V6.6a2 2 0 012-2h6.6a2 2 0 012 2z" /><path d="M17.4 10.4l4 3.4M21.4 10.4l-4 3.4" /></>,
}

/** The five forge verbs, each with its own colour and glyph. */
export const VERB_ICON: Record<string, IconName> = {
  fuse: 'fuse', cleave: 'cleave', stamp: 'stamp', share: 'share', temper: 'temper',
}

import { motion } from 'framer-motion'
import type { Hero } from '../engine/heroes'

/*
  Ten heroes, drawn the same way everything else in this game is drawn:
  flat shapes, one heavy ink outline, nothing but the palette.

  The rule that matters here is silhouette. A young child recognises a
  character by its outline long before colour or detail, so no two of
  these may read the same at thumbnail size. Hence a pair, a leaning
  speedster, a stack of blocks, a ribboned cape, a crown, a hauler with a
  block on her back, a shield, a figure with copies trailing it, and one
  tiny floating spark. Only then do the colours differ.
*/

const C = (name: string) => `var(--color-${name})`

interface Props { hero: Hero; landed: boolean; size?: number }

/** Shared ink settings, so every hero is unmistakably from the same world. */
const INK = {
  stroke: 'var(--color-ink)',
  strokeWidth: 3.6,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
}

/** A cape that flutters. Shape varies; the motion does not. */
function Cape({ fill, ribbons }: { fill: string; ribbons?: boolean }) {
  if (ribbons) {
    // cut into strips, so Slice reads as Slice even in outline
    return (
      <g fill={fill}>
        {[0, 1, 2].map((i) => (
          <motion.path
            key={i}
            d={`M${36 + i * 5} 36 C${14 + i * 6} 48 ${12 + i * 6} 82 ${20 + i * 6} 104 L${30 + i * 6} 96 C${28 + i * 6} 74 ${34 + i * 5} 52 ${44 + i * 4} 36 Z`}
            animate={{ x: [0, -3 - i, 0] }}
            transition={{ duration: 2.2 + i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </g>
    )
  }
  return (
    <motion.path
      fill={fill}
      d="M34 34 C6 44 4 84 16 106 C30 92 44 92 56 96 C46 74 44 50 52 34 Z"
      animate={{ d: [
        'M34 34 C6 44 4 84 16 106 C30 92 44 92 56 96 C46 74 44 50 52 34 Z',
        'M34 34 C2 50 10 88 22 108 C34 90 46 90 58 94 C48 72 44 50 52 34 Z',
        'M34 34 C8 40 0 78 12 102 C28 90 44 92 56 96 C46 74 44 50 52 34 Z',
        'M34 34 C6 44 4 84 16 106 C30 92 44 92 56 96 C46 74 44 50 52 34 Z',
      ] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

/** Legs: together and streamlined in flight, planted once standing. */
function Legs({ colour, landed }: { colour: string; landed: boolean }) {
  return (
    <>
      <motion.path animate={{ d: landed ? 'M44 96 L40 118' : 'M46 96 L44 120' }}
                   stroke={colour} strokeWidth={11} />
      <motion.path animate={{ d: landed ? 'M62 96 L68 116' : 'M60 96 L64 120' }}
                   stroke={colour} strokeWidth={11} />
      <motion.path animate={{ d: landed ? 'M36 118 h12' : 'M40 121 h9' }}
                   strokeWidth={9} stroke="var(--color-ink)" />
      <motion.path animate={{ d: landed ? 'M64 116 h12' : 'M60 121 h9' }}
                   strokeWidth={9} stroke="var(--color-ink)" />
    </>
  )
}

/** Masked face. The mask colour is what tells two heroes apart up close. */
function Head({ skin, mask, cx = 54, cy = 34, r = 19 }: {
  skin: string; mask: string; cx?: number; cy?: number; r?: number
}) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={skin} />
      <path d={`M${cx - 18} ${cy - 4} h36 v9 a7 7 0 01-11 4 l-7-4 -7 4 a7 7 0 01-11-4 z`} fill={mask} />
      <circle cx={cx - 8} cy={cy - 1} r={2.6} fill={C('cream')} stroke="none" />
      <circle cx={cx + 8} cy={cy - 1} r={2.6} fill={C('cream')} stroke="none" />
      <path d={`M${cx - 7} ${cy + 11} q7 6 14 0`} fill="none" strokeWidth={3} />
    </>
  )
}

/** A closed fist with the thumb up, for the raised arm. */
function ThumbsUp({ colour }: { colour: string }) {
  return (
    <g>
      <rect x={76} y={30} width={22} height={20} rx={7} fill={colour} strokeWidth={3.2} />
      <g stroke="var(--color-ink)" strokeWidth={2} strokeLinecap="round">
        <path d="M82 36.5 h13" /><path d="M82 42 h13" />
      </g>
      <path d="M80.5 31 v-9 a4.6 4.6 0 019.2 0 v9" fill={colour} strokeWidth={3.2} strokeLinejoin="round" />
    </g>
  )
}

/** The arm that waves once the hero has landed. */
function WavingArm({ colour, landed }: { colour: string; landed: boolean }) {
  return (
    <motion.g
      animate={landed ? { rotate: [0, -7, 0] } : { rotate: 0 }}
      transition={landed
        ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
        : { duration: 0.25 }}
      style={{ transformOrigin: '70px 62px' }}
    >
      <motion.path animate={{ d: landed ? 'M70 62 L82 52' : 'M68 58 L80 40' }}
                   fill="none" stroke={colour} strokeWidth={11} />
      {landed
        ? <ThumbsUp colour={C('marigold')} />
        : <g>
            <rect x={74} y={22} width={20} height={19} rx={7} fill={C('marigold')}
                  strokeWidth={3.2} transform="rotate(-24 84 31)" />
            <g stroke="var(--color-ink)" strokeWidth={2} strokeLinecap="round" transform="rotate(-24 84 31)">
              <path d="M79 28 h11" /><path d="M79 34 h11" />
            </g>
          </g>}
    </motion.g>
  )
}

/** The default build: cape, legs, torso, two arms, masked head. */
function Standard({ hero, landed, chest }: { hero: Hero; landed: boolean; chest?: React.ReactNode }) {
  const suit = C(hero.suit)
  return (
    <>
      <Cape fill={C(hero.cape)} ribbons={hero.id === 'slice'} />
      <Legs colour={C('plum')} landed={landed} />
      <rect x={36} y={52} width={36} height={48} rx={14} fill={suit} />
      {chest}
      <motion.path animate={{ d: landed ? 'M38 62 L26 76 L34 84' : 'M38 62 L32 82 L36 96' }}
                   fill="none" stroke={suit} strokeWidth={11} />
      <WavingArm colour={suit} landed={landed} />
      <Head skin={C('marigold')} mask={C(hero.trim === 'cream' ? 'plum' : hero.trim)} />
    </>
  )
}

const STAR = 'M54 62l2.6 5.4 5.9.6-4.4 4 1.3 5.8L54 74.7l-5.4 3.1 1.3-5.8-4.4-4 5.9-.6z'

export function HeroArt({ hero, landed, size = 112 }: Props) {
  const h = size * (132 / 112)
  const suit = C(hero.suit)

  return (
    <svg width={size} height={h} viewBox="-4 -6 112 132" className="overflow-visible">
      <g {...INK}>
        {/* ── Double Trouble: two of her, which nothing else looks like ── */}
        {hero.id === 'double' ? (
          <>
            <g transform="translate(-16 8) scale(0.78)" opacity={0.92}>
              <Cape fill={C(hero.cape)} />
              <Legs colour={C('berry')} landed={landed} />
              <rect x={36} y={52} width={36} height={48} rx={14} fill={suit} />
              <Head skin={C('marigold')} mask={C('berry')} />
            </g>
            <g transform="translate(18 0) scale(0.86)">
              <Cape fill={C(hero.cape)} />
              <Legs colour={C('berry')} landed={landed} />
              <rect x={36} y={52} width={36} height={48} rx={14} fill={suit} />
              <path d={STAR} fill={C('cream')} strokeWidth={2.4} />
              <WavingArm colour={suit} landed={landed} />
              <Head skin={C('marigold')} mask={C('berry')} />
            </g>
          </>

        /* ── Big Ten: fills the frame, and you can count the blocks ── */
        ) : hero.id === 'bigten' ? (
          <>
            <Cape fill={C(hero.cape)} />
            {/* short, thick legs: everything about him says heavy */}
            <motion.path animate={{ d: landed ? 'M40 112 L36 122' : 'M42 112 L40 124' }}
                         stroke={C('teal')} strokeWidth={15} />
            <motion.path animate={{ d: landed ? 'M68 112 L72 122' : 'M66 112 L68 124' }}
                         stroke={C('teal')} strokeWidth={15} />
            <path d="M28 123 h16" strokeWidth={11} />
            <path d="M64 123 h16" strokeWidth={11} />
            {/*
              Ten blocks with real gaps between them. Drawn as separate
              rects rather than a divided slab, because a child should be
              able to point at each one and count it.
            */}
            {Array.from({ length: 5 }).map((_, r) => (
              <g key={r}>
                <rect x={24} y={46 + r * 14} width={27} height={12} rx={3} fill={suit} strokeWidth={3} />
                <rect x={55} y={46 + r * 14} width={27} height={12} rx={3} fill={suit} strokeWidth={3} />
              </g>
            ))}
            <motion.path animate={{ d: landed ? 'M24 70 L10 86' : 'M24 70 L14 92' }}
                         fill="none" stroke={suit} strokeWidth={14} />
            <WavingArm colour={suit} landed={landed} />
            {/* a small head on a big body reads as size */}
            <Head skin={C('marigold')} mask={C('teal')} cx={53} cy={28} r={14} />
          </>

        /* ── Glimmer: tiny, floating, a spark with a face ── */
        ) : hero.id === 'glimmer' ? (
          <motion.g
            animate={{ y: [0, -6, 0], rotate: [0, 6, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '54px 66px' }}
          >
            {/* the star body, big enough to hold a face */}
            <path
              d="M54 34 l9 20 22 2 -16.5 15 5 21.5 -19.5-11.5 -19.5 11.5 5-21.5 -16.5-15 22-2 z"
              fill={suit} strokeWidth={4}
            />
            <circle cx={48} cy={62} r={2.8} fill={C('ink')} stroke="none" />
            <circle cx={60} cy={62} r={2.8} fill={C('ink')} stroke="none" />
            <path d="M48 70 q6 6 12 0" fill="none" strokeWidth={3} />
            {/* little trailing sparks */}
            {[[24, 46, 4], [86, 44, 3.4], [30, 92, 3]].map(([x, y, r], i) => (
              <motion.circle
                key={i} cx={x} cy={y} r={r} fill={C(hero.cape)} strokeWidth={2.4}
                animate={{ opacity: [0.35, 1, 0.35], scale: [0.8, 1.15, 0.8] }}
                transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.35 }}
              />
            ))}
          </motion.g>

        /* ── Prime: a shield, planted, and never gloomy ── */
        ) : hero.id === 'prime' ? (
          <>
            <Legs colour={C('ink-mid')} landed={landed} />
            {/*
              Sky, not charcoal. A dark hooded figure reads as the villain
              in a game for five-year-olds, which is the opposite of the
              one every child is meant to want.
            */}
            <path d="M30 44 h48 v26 c0 22 -14 32 -24 38 c-10 -6 -24 -16 -24 -38 z"
                  fill={C('sky')} strokeWidth={4} />
            {/* the seam that will not split */}
            <path d="M54 46 v56" stroke={C('cream')} strokeWidth={5} />
            <circle cx={54} cy={70} r={9} fill={C('cream')} strokeWidth={3.4} />
            <path d="M54 64 v12 M48 70 h12" stroke={C('sky')} strokeWidth={3} />
            <motion.path animate={{ d: landed ? 'M32 56 L20 70 L28 78' : 'M32 56 L26 76 L30 90' }}
                         fill="none" stroke={C('sky')} strokeWidth={11} />
            <WavingArm colour={C('sky')} landed={landed} />
            <Head skin={C('marigold')} mask={C('ink-mid')} cy={28} />
          </>

        /* ── Echo: copies trailing behind the real one ── */
        ) : hero.id === 'echo' ? (
          <>
            {[2, 1].map((k) => (
              <motion.g key={k} transform={`translate(${-k * 13} ${k * 3})`}
                        animate={{ opacity: [0.12 * (3 - k), 0.3 * (3 - k), 0.12 * (3 - k)] }}
                        transition={{ duration: 2.4, repeat: Infinity, delay: k * 0.25 }}>
                <rect x={36} y={52} width={36} height={48} rx={14} fill={suit} strokeWidth={3} />
                <circle cx={54} cy={34} r={19} fill={suit} strokeWidth={3} />
              </motion.g>
            ))}
            <Cape fill={C(hero.cape)} />
            <Legs colour={C('sky')} landed={landed} />
            <rect x={36} y={52} width={36} height={48} rx={14} fill={suit} />
            <path d={STAR} fill={C('plum')} strokeWidth={2.4} />
            <motion.path animate={{ d: landed ? 'M38 62 L26 76 L34 84' : 'M38 62 L32 82 L36 96' }}
                         fill="none" stroke={suit} strokeWidth={11} />
            <WavingArm colour={suit} landed={landed} />
            <Head skin={C('cream')} mask={C('plum')} />
          </>

        /* ── Carry: the spare ten, plainly a ten, riding on her back ── */
        ) : hero.id === 'carry' ? (
          <>
            <Legs colour={C('plum')} landed={landed} />
            {/*
              A ten-rod with nine lines across it, tilted over her
              shoulder and drawn before the body so it reads as behind
              her. Ten segments a child can count is the whole character.
            */}
            <g transform="rotate(-14 26 56)">
              <rect x={10} y={22} width={30} height={68} rx={5} fill={C('marigold')} strokeWidth={3.4} />
              {Array.from({ length: 9 }).map((_, i) => (
                <path key={i} d={`M10 ${28.8 + i * 6.8} h30`} strokeWidth={2.6} />
              ))}
            </g>
            <rect x={36} y={52} width={36} height={48} rx={14} fill={suit} />
            {/* heavy shoulders: she is built for hauling */}
            <rect x={28} y={48} width={52} height={17} rx={8.5} fill={suit} />
            <motion.path animate={{ d: landed ? 'M34 68 L22 78' : 'M34 68 L28 86' }}
                         fill="none" stroke={suit} strokeWidth={12} />
            <WavingArm colour={suit} landed={landed} />
            <Head skin={C('marigold')} mask={C('leaf')} cy={31} />
          </>

        /* ── The Countess: crowned, tall, counting beads ── */
        ) : hero.id === 'countess' ? (
          <>
            <Cape fill={C(hero.cape)} />
            <Legs colour={C('berry')} landed={landed} />
            <path d="M36 52 h36 l6 48 h-48 z" fill={suit} />
            <motion.path animate={{ d: landed ? 'M38 62 L26 76 L34 84' : 'M38 62 L32 82 L36 96' }}
                         fill="none" stroke={suit} strokeWidth={11} />
            <WavingArm colour={suit} landed={landed} />
            <Head skin={C('marigold')} mask={C('berry')} cy={32} />
            {/* crown, strung with beads she counts */}
            <path d="M38 16 l5 8 5-8 6 8 5-8 5 8 v4 h-26 z" fill={C('marigold')} />
            {[42, 50, 58].map((x, i) => (
              <circle key={i} cx={x} cy={13} r={3} fill={C('cream')} strokeWidth={2.4} />
            ))}
          </>

        /* ── Zip: leaning forward, speed lines, no cape ── */
        ) : hero.id === 'zip' ? (
          <g transform="rotate(-10 54 76)">
            {[0, 1, 2].map((i) => (
              <motion.path
                key={i}
                d={`M${4 + i * 3} ${52 + i * 12} h${26 - i * 4}`}
                stroke={C(hero.cape)} strokeWidth={5}
                animate={{ opacity: [0.25, 1, 0.25], x: [0, -5, 0] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.12 }}
              />
            ))}
            <Legs colour={C('marigold')} landed={landed} />
            <rect x={36} y={52} width={36} height={48} rx={14} fill={suit} />
            <path d="M46 62 l14 0 -8 12 10 0 -16 18 5 -14 -10 0 z" fill={C('marigold')} strokeWidth={2.4} />
            <motion.path animate={{ d: landed ? 'M38 62 L26 76 L34 84' : 'M38 62 L32 82 L36 96' }}
                         fill="none" stroke={suit} strokeWidth={11} />
            <WavingArm colour={suit} landed={landed} />
            {/* goggles rather than a mask */}
            <circle cx={54} cy={34} r={19} fill={C('marigold')} />
            <path d="M36 30 h36 v4 h-36 z" fill={C('ink')} stroke="none" />
            <circle cx={46} cy={30} r={7} fill={C('sky')} strokeWidth={3} />
            <circle cx={62} cy={30} r={7} fill={C('sky')} strokeWidth={3} />
            <path d="M47 45 q7 6 14 0" fill="none" strokeWidth={3} />
          </g>

        ) : (
          <Standard hero={hero} landed={landed}
                    chest={<path d={STAR} fill={C(hero.trim)} strokeWidth={2.4} />} />
        )}
      </g>
    </svg>
  )
}

import { motion } from 'framer-motion'
import { useState } from 'react'
import { SKILLS, SKILL_BY_ID, EDGES, GRADES, GRADE_LABEL } from '../engine/skills'
import { statusOf, currentMastery, freshState, type SkillStatus } from '../engine/mastery'
import { VERB_META } from '../engine/orders'
import { useGame } from '../state/store'
import { Button, Card, Chip, Kicker, Meter } from './ui'
import { BackToPlaying } from './BackToPlaying'

const W = 1000, H = 560

const STYLE: Record<SkillStatus, { fill: string; r: number; label: string }> = {
  mastered: { fill: '#FFB627', r: 13, label: 'Got it!' },
  fading:   { fill: '#7B2CBF', r: 11, label: 'Try again soon' },
  learning: { fill: '#2EC4B6', r: 10, label: 'Learning' },
  ready:    { fill: '#FFFDF6', r: 8,  label: 'Ready to try' },
  locked:   { fill: '#DFCCA7', r: 6,  label: 'Not yet' },
}

/**
 * The Mastery Constellation, a star chart printed on paper.
 * Stars brighten with mastery and dim on their own as the forgetting
 * curve runs, so spaced review is something a child can see.
 */
export function Constellation() {
  const states = useGame((s) => s.states)
  const day = useGame((s) => s.day)
  const [sel, setSel] = useState<string | null>(null)

  const selected = sel ? SKILL_BY_ID[sel] : null
  const selState = sel ? states[sel] ?? freshState() : null

  return (
    <div className="flex min-h-0 flex-1 flex-col px-6 pb-5">
      <div className="mb-3 flex flex-wrap items-baseline gap-3 pt-4">
        <h1 className="font-display text-3xl font-black tracking-tight">My Star Map</h1>
        <span className="text-sm text-ink-mid">Light up a star for everything you learn</span>
        <div className="ml-auto flex flex-wrap gap-2">
          {(['mastered', 'fading', 'learning', 'ready'] as SkillStatus[]).map((k) => (
            <Chip key={k}>
              <span
                className="h-3 w-3 rounded-full border-2 border-ink"
                style={{ background: STYLE[k].fill }}
              />
              {STYLE[k].label}
            </Chip>
          ))}
        </div>
      </div>

      <Card className="relative min-h-0 flex-1 overflow-hidden !p-0">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet">
          {GRADES.map((g, i) => (
            <g key={g}>
              {i % 2 === 1 && <rect x={(i / 6) * W} y={0} width={W / 6} height={H} fill="#23180F" opacity={0.035} />}
              <text
                x={(i / 6) * W + W / 12} y={26} textAnchor="middle"
                fill="#6B5A44" fontSize={11} fontWeight={800} letterSpacing="1.6"
                fontFamily="Outfit, sans-serif" style={{ textTransform: 'uppercase' }}
              >{GRADE_LABEL[g]}</text>
            </g>
          ))}

          {EDGES.map(([from, to], i) => {
            const a = SKILL_BY_ID[from]!, b = SKILL_BY_ID[to]!
            const lit = statusOf(a, states, day) === 'mastered'
            return (
              <line
                key={i}
                x1={a.star.x * W} y1={a.star.y * H} x2={b.star.x * W} y2={b.star.y * H}
                stroke="#23180F" strokeWidth={lit ? 2.5 : 1.5} strokeOpacity={lit ? 0.55 : 0.16}
                strokeDasharray={lit ? undefined : '5 6'}
              />
            )
          })}

          {SKILLS.map((s) => {
            const st = states[s.id] ?? freshState()
            const status = statusOf(s, states, day)
            const style = STYLE[status]
            const cx = s.star.x * W, cy = s.star.y * H
            const active = sel === s.id
            return (
              <g key={s.id} onClick={() => setSel(active ? null : s.id)} style={{ cursor: 'pointer' }}>
                <motion.circle
                  cx={cx} cy={cy}
                  initial={{ r: 0 }}
                  animate={{ r: active ? style.r * 1.45 : style.r }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  fill={style.fill} stroke="#23180F" strokeWidth={3}
                />
                {status === 'mastered' && (
                  <circle cx={cx} cy={cy} r={style.r + 7} fill="none" stroke="#23180F" strokeWidth={2} opacity={0.3}>
                    <animate attributeName="r" values={`${style.r + 5};${style.r + 13};${style.r + 5}`} dur="3.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0;0.4" dur="3.2s" repeatCount="indefinite" />
                  </circle>
                )}
                {(active || status !== 'locked') && (
                  <text
                    x={cx} y={cy + style.r + 17} textAnchor="middle"
                    fill={active ? '#23180F' : '#6B5A44'} fontSize={10.5} fontWeight={800}
                    fontFamily="Outfit, sans-serif"
                  >{s.label}</text>
                )}
              </g>
            )
          })}
        </svg>

        {selected && selState && (
          <motion.div
            initial={{ opacity: 0, y: 20, rotate: 2 }} animate={{ opacity: 1, y: 0, rotate: -1 }}
            className="ink-thick hard-3 absolute bottom-5 left-5 w-72 rounded-blob bg-marigold p-5"
          >
            <Kicker>{GRADE_LABEL[selected.grade]} · {VERB_META[selected.verb].name}</Kicker>
            <h3 className="mt-1 font-display text-xl font-black leading-tight">{selected.label}</h3>
            <p className="mt-1.5 text-sm leading-snug text-ink/75">{selected.detail}</p>
            <Meter value={currentMastery(selState, day)} color="tomato" className="mt-4" />
            <div className="mt-2 flex justify-between font-display text-xs font-extrabold text-ink/70">
              <span>{Math.round(currentMastery(selState, day) * 100)}% mastery</span>
              <span>{selState.correct}/{selState.attempts} forged</span>
            </div>
          </motion.div>
        )}
      </Card>

      <BackToPlaying className="mt-6 pb-4" />
    </div>
  )
}

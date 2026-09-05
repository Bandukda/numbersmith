import type { ReactNode } from 'react'

/** The slab every verb is performed on. Flat teal, thick ink, hard shadow. */
export function Anvil({ children, hot }: { children: ReactNode; hot?: boolean }) {
  return (
    <div className="flex w-full flex-col items-center">
      <div
        className={`ink-thick hard-4 grid w-[min(760px,94%)] place-items-center rounded-blob
                    px-4 py-4 transition-colors duration-300 sm:px-7 sm:py-6
                    min-h-[124px] sm:min-h-[190px]
                    ${hot ? 'bg-marigold' : 'bg-teal'}`}
      >
        {children}
      </div>
      {/* the block it sits on */}
      <div className="ink-thick -mt-1 h-3 w-[min(560px,74%)] rounded-b-blob border-t-0 bg-shade sm:h-5" />
    </div>
  )
}

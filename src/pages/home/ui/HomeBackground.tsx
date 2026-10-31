import { clsx } from 'clsx'
import type { CSSProperties } from 'react'
import { PHOTOS, type PhotoFiles } from '../config/photos'
import { loopingWalk, twicePath } from '../lib/backgroundLines'
import { Photo } from './Photo'

/** Width of one period of the lines behind the hero, in SVG units. */
const PERIOD = 1200

// Three price lines, each slid with the others by one period.
const LINES = [
  { seed: 11, middle: 120, amplitude: 60, stroke: 'var(--brand-green)', opacity: 0.3 },
  { seed: 29, middle: 175, amplitude: 50, stroke: 'var(--info)', opacity: 0.2 },
  { seed: 47, middle: 225, amplitude: 40, stroke: 'var(--text-primary)', opacity: 0.1 },
].map(({ seed, middle, amplitude, ...line }) => ({
  ...line,
  d: twicePath(loopingWalk(seed, 60), PERIOD, middle, amplitude),
}))

// Inline, so the animation shorthand of a class cannot set it back to running.
const playState = (paused: boolean): CSSProperties => ({
  animationPlayState: paused ? 'paused' : 'running',
})

/**
 * Behind the whole page, fixed to the window: a glow of the brand green and one of the info blue,
 * drifting slowly. Decoration only: hidden from screen readers, still for a user who asks for
 * less motion, stopped with the hero's Pause button.
 */
export function PageGlows({ paused }: { paused: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        style={playState(paused)}
        className="home-glow absolute -top-[35vmax] -right-[25vmax] size-[80vmax] will-change-transform motion-safe:animate-glow"
      />
      <div
        style={playState(paused)}
        className="home-glow-info absolute -bottom-[40vmax] -left-[30vmax] size-[75vmax] will-change-transform motion-safe:animate-glow-reverse"
      />
    </div>
  )
}

/**
 * Behind the hero: a city at night, closing in slowly and shaded towards the text, then the grid
 * of a chart, drifting by one square at a time, and three price lines sliding by, both fading out
 * towards the edges.
 */
export function HeroBackdrop({ paused }: { paused: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <Photo
        photo={PHOTOS.hero}
        sizes="100vw"
        eager
        style={playState(paused)}
        className="absolute inset-0 size-full opacity-50 saturate-50 will-change-transform motion-safe:animate-drift"
      />
      <div className="home-hero-shade absolute inset-0" />
      <div className="home-grid-mask absolute inset-0">
        <div
          style={playState(paused)}
          className="home-grid absolute -inset-12 will-change-transform motion-safe:animate-grid"
        />
      </div>
      <div className="home-lines-mask absolute inset-x-0 bottom-0 h-3/4">
        <svg
          viewBox={`0 0 ${2 * PERIOD} 300`}
          preserveAspectRatio="none"
          style={playState(paused)}
          className="h-full w-[200%] will-change-transform motion-safe:animate-lines"
        >
          {LINES.map((line) => (
            <path
              key={line.d}
              d={line.d}
              fill="none"
              stroke={line.stroke}
              strokeOpacity={line.opacity}
              strokeWidth="1.5"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      </div>
    </div>
  )
}

interface PhotoBackdropProps {
  photo: PhotoFiles
  /**
   * What stands on the photo: text, from below its middle, which the navy shades from there down
   * so it keeps its contrast; or a card, on an even shade.
   */
  under: 'text' | 'card'
  className?: string
}

/**
 * Behind a section: a photo across the page, fading out at the top and bottom. It moves against
 * the scroll where the browser can drive an animation by the scroll, unless the user asks for less
 * motion.
 */
export function PhotoBackdrop({ photo, under, className }: PhotoBackdropProps) {
  return (
    <div
      aria-hidden
      className={clsx(
        'home-photo-mask pointer-events-none absolute inset-x-0 -z-10 overflow-clip',
        className,
      )}
    >
      <Photo photo={photo} sizes="100vw" className="home-parallax size-full saturate-75" />
      <div
        className={clsx(
          'absolute inset-0',
          under === 'text' ? 'home-photo-shade' : 'bg-brand-navy/45',
        )}
      />
    </div>
  )
}

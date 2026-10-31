import { clsx } from 'clsx'
import type { CSSProperties } from 'react'
import type { PhotoFiles } from '../config/photos'

interface PhotoProps {
  photo: PhotoFiles
  /** The width the photo takes on the page, for the browser to pick its file. */
  sizes: string
  /** The hero's photo loads at once; the others as they come near the view. */
  eager?: boolean
  className?: string
  style?: CSSProperties
}

/** A photo for the mood of the page: decoration only, so screen readers pass over it. */
export function Photo({ photo, sizes, eager = false, className, style }: PhotoProps) {
  return (
    <img
      src={photo.src}
      srcSet={photo.srcSet}
      sizes={sizes}
      alt=""
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      style={style}
      className={clsx('object-cover', className)}
    />
  )
}

import type { ClientAccountType } from '@/shared/api/contracts'
import boardroom480 from '../assets/photos/boardroom-480.webp'
import boardroom960 from '../assets/photos/boardroom-960.webp'
import cityNight960 from '../assets/photos/city-night-960.webp'
import cityNight1920 from '../assets/photos/city-night-1920.webp'
import coast960 from '../assets/photos/coast-960.webp'
import coast1920 from '../assets/photos/coast-1920.webp'
import douala960 from '../assets/photos/douala-960.webp'
import douala1920 from '../assets/photos/douala-1920.webp'
import library480 from '../assets/photos/library-480.webp'
import library960 from '../assets/photos/library-960.webp'
import newspapers480 from '../assets/photos/newspapers-480.webp'
import newspapers960 from '../assets/photos/newspapers-960.webp'
import officesNight480 from '../assets/photos/offices-night-480.webp'
import officesNight960 from '../assets/photos/offices-night-960.webp'
import printingPress480 from '../assets/photos/printing-press-480.webp'
import printingPress960 from '../assets/photos/printing-press-960.webp'
import research480 from '../assets/photos/research-480.webp'
import research960 from '../assets/photos/research-960.webp'
import trading480 from '../assets/photos/trading-480.webp'
import trading960 from '../assets/photos/trading-960.webp'

/** One photo at two widths, the second twice the first, for the browser to choose from. */
export interface PhotoFiles {
  src: string
  srcSet: string
}

const photo = (small: string, large: string, width: number): PhotoFiles => ({
  src: large,
  srcSet: `${small} ${width}w, ${large} ${2 * width}w`,
})

/*
 * Photos for the mood of the page, from Pexels: free to use, credit not required
 * (pexels.com/license). Cropped and saved as WebP; each from pexels.com/photo/<number>:
 * - hero: a city at night, 1834686, Marcelo Jimenez
 * - markets: Douala and the Wouri at sunset, 12251157, Xavier Messina
 * - closing: a coastal city at dusk, 3030329, K (@kelly)
 * - student: library shelves in Yaoundé, 18713701, Ulrich Keutchatang
 * - analyst: charts under a magnifying glass, 5561913, Leeloo The First
 * - manager: a boardroom over a city, 5717314, Tima Miroshnichenko
 * - trader: a trader before a chart, 7567522, Tima Miroshnichenko
 * - journalist: a stack of newspapers, 5505718
 * - ceo: the lit windows of an office tower at night, 18824803
 * - newsProvider: a newspaper's printing press, its team sorting the day's copies, 36376366
 */
export const PHOTOS = {
  hero: photo(cityNight960, cityNight1920, 960),
  markets: photo(douala960, douala1920, 960),
  closing: photo(coast960, coast1920, 960),
} as const

export const AUDIENCE_PHOTOS: Record<ClientAccountType, PhotoFiles> = {
  student: photo(library480, library960, 480),
  analyst: photo(research480, research960, 480),
  manager: photo(boardroom480, boardroom960, 480),
  trader: photo(trading480, trading960, 480),
  journalist: photo(newspapers480, newspapers960, 480),
  ceo: photo(officesNight480, officesNight960, 480),
  newsProvider: photo(printingPress480, printingPress960, 480),
}

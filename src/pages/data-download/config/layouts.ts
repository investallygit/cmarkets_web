import type { ScreenPanel } from '@/features/workspace-layout'

/**
 * DL's panels (spec section 9, screen 30, fifth version), in grid units (12 columns x 26 rows), as
 * the mockup:
 *
 *   datasets | settings | my downloads
 *   datasets | preview  | my limits
 */
// prettier-ignore
export const DATA_DOWNLOAD_LAYOUT: readonly ScreenPanel[] = [
  { i: 'datasets', name: 'exportDatasets', x: 0, y: 0, w: 3, h: 26, minW: 2, minH: 8 },
  { i: 'settings', name: 'exportSettings', x: 3, y: 0, w: 6, h: 15, minW: 4, minH: 8 },
  { i: 'preview', name: 'exportPreview', x: 3, y: 15, w: 6, h: 11, minW: 4, minH: 6 },
  { i: 'downloads', name: 'myDownloads', x: 9, y: 0, w: 3, h: 15, minW: 2, minH: 6 },
  { i: 'limits', name: 'myLimits', x: 9, y: 15, w: 3, h: 11, minW: 2, minH: 6 },
]

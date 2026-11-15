import type { DailyReportSettingsDto, DailyReportSettingsInput } from '@/shared/api/contracts'

/** "Settings (Admin): send time, BEAC address, copies, nil report" as the dialog edits them. */
export interface SettingsForm {
  sendTime: string
  beacAddress: string
  copies: string[]
  nilReport: boolean
}

export type SettingsError = 'time' | 'address' | 'duplicate' | 'tooMany'

export interface SettingsErrors {
  sendTime?: SettingsError
  beacAddress?: SettingsError
  /** Each copy's, by its place in the list. */
  copies: (SettingsError | undefined)[]
  list?: SettingsError
}

/** CMarket.Api takes ten copies at most. */
export const MAX_COPIES = 10

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function formOf(settings: DailyReportSettingsDto): SettingsForm {
  return {
    sendTime: settings.sendTime,
    beacAddress: settings.beacAddress,
    copies: [...settings.copies],
    nilReport: settings.nilReport,
  }
}

const normal = (address: string) => address.trim().toLowerCase()

/** The form's errors, as CMarket.Api checks them: a time HH:mm, addresses, each once. */
export function settingsErrors(form: SettingsForm): SettingsErrors {
  const beac = normal(form.beacAddress)
  const seen = new Set<string>([beac])
  const copies = form.copies.map((copy): SettingsError | undefined => {
    const address = normal(copy)
    if (address.length === 0) return undefined
    if (!EMAIL.test(address)) return 'address'
    if (seen.has(address)) return 'duplicate'
    seen.add(address)
    return undefined
  })
  return {
    sendTime: TIME.test(form.sendTime.trim()) ? undefined : 'time',
    beacAddress: EMAIL.test(beac) ? undefined : 'address',
    copies,
    list:
      form.copies.filter((copy) => copy.trim().length > 0).length > MAX_COPIES
        ? 'tooMany'
        : undefined,
  }
}

export function hasErrors(errors: SettingsErrors): boolean {
  return (
    Boolean(errors.sendTime ?? errors.beacAddress ?? errors.list) || errors.copies.some(Boolean)
  )
}

/** What PUT sends: the copies left blank dropped, at the version read. */
export function inputOf(form: SettingsForm, version: string): DailyReportSettingsInput {
  return {
    sendTime: form.sendTime.trim(),
    beacAddress: form.beacAddress.trim(),
    copies: form.copies.map((copy) => copy.trim()).filter((copy) => copy.length > 0),
    nilReport: form.nilReport,
    version,
  }
}

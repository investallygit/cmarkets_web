import type { TFunction } from 'i18next'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

/** The catalogue's plans, which CMarket.Api names in English, by their ids. */
const PLAN_NAMES = {
  monitoring: 'subscription.planNames.monitoring',
  analysis: 'subscription.planNames.analysis',
  professional: 'subscription.planNames.professional',
  student: 'subscription.planNames.student',
  'media-source': 'subscription.planNames.mediaSource',
} as const

/**
 * A plan's name in the user's language (B17 of ROADMAP step 50: a French page read "Professional",
 * "Monitoring"): the catalogue's by its id, another plan by the name the API gives it.
 */
export function planNameOf(t: TFunction, plan: { id: string; name: string }): string {
  const key = PLAN_NAMES[plan.id as keyof typeof PLAN_NAMES]
  return key ? t(key) : plan.name
}

/** The catalogue's plans by the English names CMarket.Api gives them, where no id comes with one. */
const PLAN_IDS: Record<string, keyof typeof PLAN_NAMES> = {
  Monitoring: 'monitoring',
  Analysis: 'analysis',
  Professional: 'professional',
  Student: 'student',
  'Media source': 'media-source',
}

/** A plan named by the API without its id, an invoice's: the catalogue's in the page's language. */
export function planNameOfLabel(t: TFunction, label: string): string {
  const id = PLAN_IDS[label]
  return id ? planNameOf(t, { id, name: label }) : label
}

/** planNameOf with the page's language. */
export function usePlanName(): (plan: { id: string; name: string }) => string {
  const { t } = useTranslation()
  return useCallback((plan) => planNameOf(t, plan), [t])
}

import i18next from 'i18next'
import { describe, expect, it } from 'vitest'
import { planNameOf, planNameOfLabel } from './planName'

describe('planNameOf', () => {
  it("names the catalogue's plans in the page's language, another plan as the API does (B17)", async () => {
    const t = await i18next.createInstance().init({
      lng: 'fr',
      resources: {
        fr: { translation: { subscription: { planNames: { professional: 'Professionnel' } } } },
      },
    })
    expect(planNameOf(t, { id: 'professional', name: 'Professional' })).toBe('Professionnel')
    expect(planNameOf(t, { id: 'bank-special', name: 'Bank special' })).toBe('Bank special')
  })

  it("names an invoice's plan by the English name it carries", async () => {
    const t = await i18next.createInstance().init({
      lng: 'fr',
      resources: { fr: { translation: { subscription: { planNames: { analysis: 'Analyse' } } } } },
    })
    expect(planNameOfLabel(t, 'Analysis')).toBe('Analyse')
    expect(planNameOfLabel(t, 'SEMC: volume growth')).toBe('SEMC: volume growth')
  })
})

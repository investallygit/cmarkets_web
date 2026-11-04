import { describe, expect, it } from 'vitest'
import { EMPTY_SIGN_UP, signUpIssues, toFormData, type SignUpForm } from './signUpForm'

const filled: SignUpForm = {
  ...EMPTY_SIGN_UP,
  accountType: 'trader',
  displayName: 'T. Nguema',
  email: 't.nguema@bank.example',
  password: 'cmarket2026',
  confirmPassword: 'cmarket2026',
  acceptTerms: true,
}

const pdf = (name: string) => new File(['%PDF-1.4'], name, { type: 'application/pdf' })

describe('sign-up form', () => {
  it('asks for every field and the terms', () => {
    expect(signUpIssues(EMPTY_SIGN_UP)).toEqual({
      accountType: 'required',
      displayName: 'required',
      email: 'required',
      password: 'password',
      acceptTerms: 'terms',
    })
    expect(signUpIssues(filled)).toEqual({})
  })

  it('checks the address, the confirmation and the phone', () => {
    expect(
      signUpIssues({ ...filled, email: 't.nguema', confirmPassword: 'other', phone: '6 70' }),
    ).toEqual({ email: 'email', confirmPassword: 'mismatch', phone: 'phone' })
  })

  it('asks an Analyst for an identity document and a CV, the licence being optional', () => {
    const analyst = { ...filled, accountType: 'analyst' as const }
    expect(signUpIssues(analyst)).toEqual({ identityDocument: 'required', cv: 'required' })
    expect(
      signUpIssues({
        ...analyst,
        documents: { identityDocument: pdf('id.pdf'), cv: pdf('cv.pdf') },
      }),
    ).toEqual({})
  })

  it('asks a Journalist for a press card or an employer letter', () => {
    const journalist = { ...filled, accountType: 'journalist' as const }
    expect(signUpIssues(journalist)).toEqual({ pressCredential: 'required' })
    expect(
      signUpIssues({ ...journalist, documents: { pressCredential: pdf('press-card.pdf') } }),
    ).toEqual({})
  })

  it('asks a CEO for a proof of position and the organisation they head', () => {
    const ceo = { ...filled, accountType: 'ceo' as const }
    expect(signUpIssues(ceo)).toEqual({ proofOfPosition: 'required', organizationName: 'required' })
    expect(
      signUpIssues({
        ...ceo,
        organizationName: 'Pension fund G',
        documents: { proofOfPosition: pdf('appointment.pdf') },
      }),
    ).toEqual({})
  })

  it('sends the documents of the account type only', () => {
    const data = toFormData(
      {
        ...filled,
        accountType: 'student',
        documents: { proofOfEnrolment: pdf('card.pdf'), cv: pdf('cv.pdf') },
      },
      'fr',
    )
    expect(data.get('proofOfEnrolment')).toBeInstanceOf(File)
    expect(data.get('cv')).toBeNull()
    expect(data.get('language')).toBe('fr')
    expect(data.get('phone')).toBeNull()
    expect(data.get('acceptTerms')).toBe('true')
  })
})

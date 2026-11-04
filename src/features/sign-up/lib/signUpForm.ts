import { isEmailAddress, passwordIssues } from '@/entities/session'
import type { ClientAccountType, SignUpDocument, UserLanguage } from '@/shared/api/contracts'
import { isPhoneNumber } from '@/shared/lib/phone'

export interface SignUpForm {
  accountType: ClientAccountType | null
  displayName: string
  email: string
  password: string
  confirmPassword: string
  phone: string
  organizationName: string
  documents: Partial<Record<SignUpDocument, File>>
  acceptTerms: boolean
}

export const EMPTY_SIGN_UP: SignUpForm = {
  accountType: null,
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  organizationName: '',
  documents: {},
  acceptTerms: false,
}

/**
 * Documents of spec section 12: a Student without a school address proves the enrolment (the
 * server knows the school domains); an Analyst sends an identity document and a CV, and a licence
 * if any; a Journalist a press card or a letter from the employer; a CEO a proof of position. An
 * Admin checks those of the last three before approving the status.
 */
export function documentsFor(
  accountType: ClientAccountType | null,
): { kind: SignUpDocument; required: boolean }[] {
  if (accountType === 'student') return [{ kind: 'proofOfEnrolment', required: false }]
  if (accountType === 'analyst') {
    return [
      { kind: 'identityDocument', required: true },
      { kind: 'cv', required: true },
      { kind: 'licence', required: false },
    ]
  }
  if (accountType === 'journalist') return [{ kind: 'pressCredential', required: true }]
  if (accountType === 'ceo') return [{ kind: 'proofOfPosition', required: true }]
  return []
}

export type SignUpField =
  | 'accountType'
  | 'displayName'
  | 'email'
  | 'password'
  | 'confirmPassword'
  | 'phone'
  | 'organizationName'
  | 'acceptTerms'
  | SignUpDocument

export type SignUpIssue = 'required' | 'email' | 'password' | 'mismatch' | 'phone' | 'terms'

/** What the form lacks before it is sent; the server checks the same and more. */
export function signUpIssues(form: SignUpForm): Partial<Record<SignUpField, SignUpIssue>> {
  const issues: Partial<Record<SignUpField, SignUpIssue>> = {}
  if (!form.accountType) issues.accountType = 'required'
  if (!form.displayName.trim()) issues.displayName = 'required'
  if (!isEmailAddress(form.email)) issues.email = form.email.trim() ? 'email' : 'required'
  if (passwordIssues(form.password).length > 0) issues.password = 'password'
  if (form.confirmPassword !== form.password) issues.confirmPassword = 'mismatch'
  if (form.phone.trim() && !isPhoneNumber(form.phone)) issues.phone = 'phone'
  // A CEO is linked to the organisation they head (spec section 12).
  if (form.accountType === 'ceo' && !form.organizationName.trim()) {
    issues.organizationName = 'required'
  }
  for (const { kind, required } of documentsFor(form.accountType)) {
    if (required && !form.documents[kind]) issues[kind] = 'required'
  }
  if (!form.acceptTerms) issues.acceptTerms = 'terms'
  return issues
}

/** POST /auth/register as a multipart form, with the documents of the account type only. */
export function toFormData(form: SignUpForm, language: UserLanguage): FormData {
  const data = new FormData()
  data.append('accountType', form.accountType ?? '')
  data.append('displayName', form.displayName.trim())
  data.append('email', form.email.trim())
  data.append('password', form.password)
  if (form.phone.trim()) data.append('phone', form.phone.trim())
  if (form.organizationName.trim()) data.append('organizationName', form.organizationName.trim())
  data.append('language', language)
  data.append('acceptTerms', String(form.acceptTerms))
  for (const { kind } of documentsFor(form.accountType)) {
    const file = form.documents[kind]
    if (file) data.append(kind, file)
  }
  return data
}

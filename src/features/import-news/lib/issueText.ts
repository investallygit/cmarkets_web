import type { TFunction } from 'i18next'
import type { NewsImportIssueDto } from '@/shared/api/contracts'

/** The codes the screen words; another one shows the API's own sentence. */
const KNOWN_CODES = new Set([
  'required',
  'tooLong',
  'unknownType',
  'unknownCategory',
  'unknownCountry',
  'unknownSecurity',
  'unknownLanguage',
  'tooManySecurities',
  'badDate',
  'pastDate',
  'badUrl',
  'flashTooLong',
  'flashBody',
  'flashFile',
  'badFile',
  'missingFile',
  'missingCredit',
  'duplicateId',
  'duplicateHeadline',
  'flashQuota',
  'withdrawnItem',
  'typeChanged',
  'invalid',
])

/** What a check found, in the user's language: "Unknown security code “SEMCX”". */
export function issueText(t: TFunction, issue: NewsImportIssueDto): string {
  if (!KNOWN_CODES.has(issue.code)) return issue.message
  return t(`newsStudio.import.codes.${issue.code}` as 'newsStudio.import.codes.invalid', {
    column: issue.column,
    value: issue.value ?? '',
    limit: issue.limit ?? '',
    message: issue.message,
  })
}

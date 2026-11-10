import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { useNewsImportRows } from '@/entities/news'
import type { NewsImportDto, NewsImportRowDto, NewsImportRowStatus } from '@/shared/api/contracts'
import { Dialog, DialogBody } from '@/shared/ui/Dialog'
import { QueryView } from '@/shared/ui/QueryView'
import { issueText } from '../lib/issueText'

const STATUS_COLORS: Record<NewsImportRowStatus, string> = {
  valid: 'text-info',
  error: 'text-down',
  published: 'text-up',
  updated: 'text-up',
}

interface NewsImportRowsDialogProps {
  upload: NewsImportDto | null
  onClose: () => void
  onFix: (row: NewsImportRowDto) => void
}

/** View details: every row of the upload, its status and what its checks found. */
export function NewsImportRowsDialog({ upload, onClose, onFix }: NewsImportRowsDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog
      open={upload !== null}
      onClose={onClose}
      title={upload ? t('newsStudio.import.detailsTitle', { file: upload.fileName }) : ''}
      width={760}
    >
      {upload && <Rows upload={upload} onFix={onFix} />}
    </Dialog>
  )
}

function Rows({
  upload,
  onFix,
}: {
  upload: NewsImportDto
  onFix: (row: NewsImportRowDto) => void
}) {
  const { t } = useTranslation()
  const rows = useNewsImportRows(upload.id, null)
  return (
    <DialogBody>
      <QueryView query={rows}>
        {(page) => (
          <table className="w-full font-sans text-data">
            <thead className="text-left text-secondary">
              <tr>
                <th className="py-1 pr-2 font-normal">{t('newsStudio.import.line')}</th>
                <th className="py-1 pr-2 font-normal">external_id</th>
                <th className="py-1 pr-2 font-normal">title</th>
                <th className="py-1 pr-2 font-normal">{t('newsStudio.import.status')}</th>
                <th className="py-1 font-normal">{t('newsStudio.import.issues')}</th>
              </tr>
            </thead>
            <tbody>
              {page.items.map((row) => (
                <tr key={row.id} className="border-t align-top">
                  <td className="py-1 pr-2 font-mono">{row.line}</td>
                  <td className="py-1 pr-2 font-mono break-all">{row.externalId}</td>
                  <td className="py-1 pr-2">{row.values.title}</td>
                  <td className={clsx('py-1 pr-2', STATUS_COLORS[row.status])}>
                    {t(`newsStudio.import.rowStatuses.${row.status}`)}
                  </td>
                  <td className="py-1">
                    {row.issues.map((issue) => (
                      <p key={`${issue.code}-${issue.column}`} className="text-down">
                        {issueText(t, issue)}
                      </p>
                    ))}
                    {row.status === 'error' && upload.status !== 'checking' && (
                      <button
                        type="button"
                        onClick={() => onFix(row)}
                        className="h-6 text-info hover:underline"
                      >
                        {t('newsStudio.import.fix', { line: row.line })}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </QueryView>
    </DialogBody>
  )
}

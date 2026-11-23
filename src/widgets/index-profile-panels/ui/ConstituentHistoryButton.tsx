import { useQueryClient } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { indexMembersQuery } from '@/entities/market'
import { useFormat } from '@/shared/i18n'
import { downloadXlsx } from '@/shared/lib/xlsx'
import { Button } from '@/shared/ui/form/Button'
import { toast } from '@/shared/ui/toast'

/**
 * "Constituent history" (spec section 9, screen 31, fifth version: methodology and notices): every
 * member the index had, its published weight and its span, as an XLSX workbook built in the page.
 * API /indices/{code}/constituents/history.
 */
export function ConstituentHistoryButton({ code, label }: { code: string; label?: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)

  const download = async () => {
    setBusy(true)
    try {
      const members = await queryClient.fetchQuery(indexMembersQuery(code))
      await downloadXlsx(`${code}-constituent-history`, [
        [
          t('indexProfile.constituents.security'),
          t('indexProfile.history.name'),
          t('indexProfile.constituents.weight'),
          t('indexProfile.constituents.entry'),
          t('indexProfile.constituents.exit'),
        ],
        ...members.map((member) => [
          member.code,
          member.name,
          member.weightPct,
          format.isoDate(member.entryDate),
          member.exitDate === null ? null : format.isoDate(member.exitDate),
        ]),
      ])
    } catch (failure) {
      toast.error(failure instanceof Error ? failure.message : String(failure))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button size="sm" icon={Download} busy={busy} onClick={() => void download()}>
      {label ?? t('indexProfile.history.download')}
    </Button>
  )
}

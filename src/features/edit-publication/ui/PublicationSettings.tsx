import { Paperclip, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DISCLOSURES,
  ratingsFor,
  ratingTone,
  usePublicationRules,
  usePublicationStep,
  useRemoveAttachment,
  useUploadAttachment,
} from '@/entities/publication'
import { isApiError } from '@/shared/api'
import { researchApi } from '@/shared/api/endpoints'
import type { PublicationDto, PublicationRulesDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { saveBlob } from '@/shared/lib/download'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Button } from '@/shared/ui/form/Button'
import { Checkbox } from '@/shared/ui/form/Checkbox'
import { DateInput } from '@/shared/ui/form/DateInput'
import { Field } from '@/shared/ui/form/Field'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { SegmentedControl } from '@/shared/ui/form/SegmentedControl'
import { PanelLoading } from '@/shared/ui/StatusViews'
import { toast } from '@/shared/ui/toast'
import {
  allDisclosed,
  contentIssues,
  hasIssues,
  MAX_FREE_AFTER_MONTHS,
  MAX_HORIZON_MONTHS,
  pricingIssues,
  submissionIssues,
} from '../model/draftForm'
import { isDirty, isEditable, useDraftStore, type Draft } from '../model/draftStore'
import { useSaveDraft } from '../model/useSaveDraft'
import { ReaderPreviewDialog } from './ReaderPreviewDialog'

/** Longer labels, as in French, go on two lines in a narrow panel. */
const WRAPPING = 'h-auto! min-h-8.5 py-1 leading-tight whitespace-normal!'

const SECTION_TITLE =
  'font-sans text-title font-semibold tracking-title text-accent-amber uppercase'

/**
 * Screen 7, right: access and prices within the Admin's range, rating, mandatory disclosures,
 * attachment, then Reader preview and Submit, which waits for every disclosure. A published
 * publication gets a new version instead; prices apply to readers at once.
 */
export function PublicationSettings({ publication }: { publication: PublicationDto }) {
  const draft = useDraftStore((state) => state.draft)
  const rules = usePublicationRules().data
  if (draft?.publicationId !== publication.id || !rules) return <PanelLoading />
  return <SettingsForm publication={publication} draft={draft} rules={rules} />
}

interface SettingsFormProps {
  publication: PublicationDto
  draft: Draft
  rules: PublicationRulesDto
}

function SettingsForm({ publication, draft, rules }: SettingsFormProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const edit = useDraftStore((state) => state.edit)
  const editPricing = useDraftStore((state) => state.editPricing)
  const save = useSaveDraft()
  const step = usePublicationStep(publication.id)
  const [previewing, setPreviewing] = useState(false)
  const [archiving, setArchiving] = useState(false)

  const { form, pricing } = draft
  const editable = isEditable(draft)
  const company = form.subjectType === 'company'
  const current = { access: draft.savedAccess, readFree: draft.readFree }
  const issues = draft.checked
    ? submissionIssues(form, pricing, rules, current)
    : { ...contentIssues(form), ...pricingIssues(pricing, rules, current) }
  const values = {
    min: format.number(rules.minPrice, 0),
    max: format.number(rules.maxPrice, 0),
    months: MAX_FREE_AFTER_MONTHS,
    horizon: MAX_HORIZON_MONTHS,
  }
  const message = (field: string) =>
    (issues[field] && t(`studio.errors.${issues[field]}`, values)) ||
    draft.serverErrors[field]?.[0] ||
    null
  const disclosed = allDisclosed(form.disclosures)
  const changed = draft.hasChanges || isDirty(draft)
  const latest = publication.versions.at(-1)

  const publish = async () => {
    useDraftStore.getState().check(publication.id)
    if (hasIssues(submissionIssues(form, pricing, rules, current))) return
    if (!(await save())) return
    step.mutate(
      { kind: draft.published ? 'versions' : 'submit' },
      {
        onSuccess: (saved) => {
          useDraftStore.getState().open(saved)
          const done =
            saved.status === 'pending' ? 'pending' : draft.published ? 'updated' : 'published'
          toast.success(t(`studio.submit.${done}`, { title: saved.title }))
        },
        onError: (error) => {
          if (isApiError(error, 422)) {
            useDraftStore.getState().rejected(publication.id, error.problem.errors ?? {})
          } else toast.error(error.message)
        },
      },
    )
  }

  return (
    <div className="flex min-h-full flex-col gap-3 p-3">
      <StatusNote draft={draft} publication={publication} />

      <Field label={t('studio.settings.access')} group error={message('access')}>
        <SegmentedControl
          value={pricing.access}
          options={[
            { value: 'free', label: t('studio.settings.free') },
            {
              value: 'paid',
              label: t('studio.settings.paid'),
              disabled: draft.readFree && draft.savedAccess === 'free',
            },
          ]}
          onChange={(access) => editPricing({ access })}
          disabled={!editable}
        />
      </Field>
      {draft.readFree && draft.savedAccess === 'free' && (
        <p className="-mt-2 font-sans text-title text-secondary">
          {t('studio.settings.staysFree')}
        </p>
      )}
      {pricing.access === 'paid' && (
        <>
          <Field
            label={t('studio.settings.price')}
            hint={t('studio.settings.range', values)}
            error={message('price')}
          >
            <NumberInput
              value={pricing.price}
              onChange={(price) => editPricing({ price })}
              decimals={0}
              disabled={!editable}
              highlight={pricing.price === null}
            />
          </Field>
          <Field
            label={t('studio.settings.studentPrice')}
            hint={t('studio.settings.optional')}
            error={message('studentPrice')}
          >
            <NumberInput
              value={pricing.studentPrice}
              onChange={(studentPrice) => editPricing({ studentPrice })}
              decimals={0}
              disabled={!editable}
            />
          </Field>
          <Field
            label={t('studio.settings.freeAfter')}
            hint={t('studio.settings.optional')}
            error={message('freeAfterMonths')}
          >
            <NumberInput
              value={pricing.freeAfterMonths}
              onChange={(freeAfterMonths) => editPricing({ freeAfterMonths })}
              decimals={0}
              suffix={t('studio.settings.months')}
              disabled={!editable}
            />
          </Field>
        </>
      )}

      <Field
        label={t(company ? 'studio.settings.rating' : 'studio.settings.outlook')}
        group
        error={message('rating')}
      >
        <SegmentedControl
          value={form.rating}
          options={ratingsFor(form.subjectType).map((rating) => {
            const tone = ratingTone(rating)
            return {
              value: rating,
              label: t(`studio.settings.ratings.${rating}`),
              ...(tone !== 'neutral' && { tone }),
            }
          })}
          onChange={(rating) => edit({ rating })}
          disabled={!editable}
        />
      </Field>
      {company ? (
        <>
          <Field inline label={t('studio.settings.target')} error={message('targetPrice')}>
            <NumberInput
              value={form.targetPrice}
              onChange={(targetPrice) => edit({ targetPrice })}
              decimals={0}
              disabled={!editable}
            />
          </Field>
          <Field inline label={t('studio.settings.horizon')} error={message('horizonMonths')}>
            <NumberInput
              value={form.horizonMonths}
              onChange={(horizonMonths) => edit({ horizonMonths })}
              decimals={0}
              suffix={t('studio.settings.months')}
              disabled={!editable}
            />
          </Field>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] items-center gap-x-3">
            <span className="font-sans text-data text-secondary">
              {t('studio.settings.reference')}
            </span>
            <span
              className="text-right font-mono text-data"
              title={t('studio.settings.referenceHint')}
            >
              {draft.referencePrice !== null && draft.referenceDate
                ? `${format.number(draft.referencePrice, 0)} (${format.dayMonth(draft.referenceDate)})`
                : '—'}
            </span>
          </div>
        </>
      ) : (
        <Field inline label={t('studio.settings.dataDate')} error={message('dataDate')}>
          <DateInput
            value={form.dataDate}
            onChange={(dataDate) => edit({ dataDate })}
            disabled={!editable}
            highlight={!form.dataDate}
          />
        </Field>
      )}

      <section className="flex flex-col gap-1.5" aria-labelledby="disclosures-title">
        <h3 id="disclosures-title" className={SECTION_TITLE}>
          {t('studio.settings.disclosures')}
        </h3>
        {DISCLOSURES.map((key) => (
          <Checkbox
            key={key}
            checked={form.disclosures[key]}
            onChange={(checked) => edit({ disclosures: { ...form.disclosures, [key]: checked } })}
            label={t(
              key === 'conflicts'
                ? `studio.disclosures.conflicts_${company ? 'company' : 'country'}`
                : `studio.disclosures.${key}`,
              { code: form.subjectCode ?? '…' },
            )}
            highlight
            disabled={!editable}
          />
        ))}
        {message('disclosures') && (
          <p className="font-sans text-title text-down">{message('disclosures')}</p>
        )}
      </section>

      <AttachmentRow publication={publication} editable={editable} />
      <p className="font-sans text-data text-secondary">
        {t(`studio.settings.moderation.${rules.moderation}`)}
      </p>

      <div className="mt-auto flex flex-col gap-2 pt-2">
        <div className="grid grid-cols-2 gap-2">
          <Button size="lg" onClick={() => setPreviewing(true)} className={WRAPPING}>
            {t('studio.preview.open')}
          </Button>
          <Button
            size="lg"
            variant="primary"
            className={`${WRAPPING} uppercase`}
            disabled={!editable || !disclosed || (draft.published && !changed)}
            busy={step.isPending}
            onClick={() => void publish()}
          >
            {draft.published ? t('studio.submit.update') : t('studio.submit.submit')}
          </Button>
        </div>
        {editable && !disclosed && (
          <p className="font-sans text-title text-warning">
            {t(draft.published ? 'studio.submit.updateHint' : 'studio.submit.hint', {
              count: DISCLOSURES.length,
            })}
          </p>
        )}
        {editable && disclosed && draft.published && !changed && latest && (
          <p className="font-sans text-title text-secondary">
            {t('studio.submit.noChange', { version: latest.number })}
          </p>
        )}
        {draft.status !== 'archived' && (
          <Button
            variant="link"
            size="sm"
            className="self-start"
            onClick={() => setArchiving(true)}
          >
            {t(draft.published ? 'studio.archive.withdraw' : 'studio.archive.archive')}
          </Button>
        )}
      </div>

      <ReaderPreviewDialog
        open={previewing}
        onClose={() => setPreviewing(false)}
        publication={publication}
      />
      <ConfirmDialog
        open={archiving}
        onClose={() => setArchiving(false)}
        title={t(draft.published ? 'studio.archive.withdrawTitle' : 'studio.archive.archiveTitle')}
        message={t(
          draft.published ? 'studio.archive.withdrawMessage' : 'studio.archive.archiveMessage',
        )}
        confirmLabel={t(draft.published ? 'studio.archive.withdraw' : 'studio.archive.archive')}
        tone="danger"
        requireReason
        busy={step.isPending}
        onConfirm={(reason) =>
          step.mutate(
            { kind: 'archive', reason },
            {
              onSuccess: (saved) => {
                useDraftStore.getState().open(saved)
                setArchiving(false)
                toast.info(t('studio.archive.done', { title: saved.title }))
              },
              onError: (error) => toast.error(error.message),
            },
          )
        }
      />
    </div>
  )
}

/** Where the publication stands: in moderation, archived, or published with its version. */
function StatusNote({ draft, publication }: { draft: Draft; publication: PublicationDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const latest = publication.versions.at(-1)
  if (draft.status === 'pending') {
    return <p className="font-sans text-data text-warning">{t('studio.status.pending')}</p>
  }
  if (draft.status === 'archived') {
    return (
      <p className="font-sans text-data text-secondary">
        {t('studio.status.archived', { reason: publication.archiveReason ?? '' })}
      </p>
    )
  }
  if (draft.status === 'published' && latest) {
    return (
      <p className="font-sans text-data text-secondary">
        {t('studio.status.published', {
          version: latest.number,
          date: format.date(latest.publishedAt),
        })}
      </p>
    )
  }
  return null
}

/** The optional PDF of the publication (spec section 13). */
function AttachmentRow({
  publication,
  editable,
}: {
  publication: PublicationDto
  editable: boolean
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const upload = useUploadAttachment(publication.id)
  const remove = useRemoveAttachment(publication.id)
  const input = useRef<HTMLInputElement>(null)
  const { attachment } = publication
  const onError = (error: Error) => toast.error(error.message)

  return (
    <div className="flex items-center gap-2">
      {attachment ? (
        <>
          <button
            type="button"
            className="min-w-0 truncate text-left font-sans text-data text-info hover:underline"
            onClick={() =>
              void researchApi
                .attachmentFile(publication.id, attachment.id)
                .then((blob) => saveBlob(blob, attachment.fileName), onError)
            }
          >
            {t('studio.attachment.file', {
              name: attachment.fileName,
              size: format.fileSize(attachment.size),
            })}
          </button>
          {editable && (
            <button
              type="button"
              aria-label={t('studio.attachment.remove', { name: attachment.fileName })}
              disabled={remove.isPending}
              onClick={() => remove.mutate(attachment.id, { onError })}
              className="text-secondary hover:text-down"
            >
              <X aria-hidden className="size-3.5" />
            </button>
          )}
        </>
      ) : (
        editable && (
          <Button
            size="sm"
            icon={Paperclip}
            busy={upload.isPending}
            onClick={() => input.current?.click()}
          >
            {t('studio.attachment.add')}
          </Button>
        )
      )}
      <input
        ref={input}
        type="file"
        accept="application/pdf"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) upload.mutate(file, { onError })
        }}
      />
    </div>
  )
}

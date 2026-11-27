import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DOCUMENT_TYPES, useSaveDocument } from '@/entities/document'
import { hasIndexProfile, useIndices } from '@/entities/market'
import { SecurityListField } from '@/entities/security'
import { isApiError } from '@/shared/api'
import type { DocumentDto, DocumentType } from '@/shared/api/contracts'
import { CEMAC_COUNTRIES, cemacCode3 } from '@/shared/config/countries'
import { useFormat } from '@/shared/i18n'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { FileDrop } from '@/shared/ui/form/FileDrop'
import { Select } from '@/shared/ui/form/Select'
import { TextInput } from '@/shared/ui/form/TextInput'
import { toast } from '@/shared/ui/toast'

const MAX_PDF_BYTES = 20 * 1024 * 1024

interface DocumentFormProps {
  /** The document edited; null for a new one. */
  document: DocumentDto | null
  onSaved: (document: DocumentDto) => void
}

/**
 * NEWS: a document of an issuer or an institution (annual report, notice, decision...) with its
 * PDF; it shows in the DOC tab of its securities and in the N screen's library.
 */
export function DocumentForm({ document, onSaved }: DocumentFormProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const save = useSaveDocument()
  const [type, setType] = useState<DocumentType>(document?.type ?? 'release')
  const [title, setTitle] = useState(document?.title ?? '')
  const [source, setSource] = useState(document?.source ?? '')
  const [securityIds, setSecurityIds] = useState<string[]>(document?.securityIds ?? [])
  // The index it is about: an index profile's DOC tab lists it (screen 31, ROADMAP decision 44).
  const [indexCode, setIndexCode] = useState(document?.indexCode ?? '')
  const indices = (useIndices().data ?? []).filter((index) => hasIndexProfile(index.code))
  // The state it is about: DEBT lists it beside the ratings (screen 35, ROADMAP decision 60).
  const [countryCode, setCountryCode] = useState(document?.countryCode ?? '')
  const [file, setFile] = useState<File | null>(null)
  const errors = isApiError(save.error, 400) ? (save.error.problem.errors ?? {}) : {}

  return (
    <form
      noValidate
      className="grid gap-3 p-3"
      onSubmit={(event) => {
        event.preventDefault()
        save.mutate(
          {
            id: document?.id ?? null,
            document: {
              type,
              title: title.trim(),
              source: source.trim().toUpperCase(),
              securityIds,
              indexCode: indexCode || null,
              countryCode: countryCode || null,
            },
            file,
          },
          {
            onSuccess: (saved) => {
              toast.success(document ? t('content.updated') : t('content.published'))
              onSaved(saved)
            },
          },
        )
      }}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_8rem] gap-3">
        <Field label={t('content.documentType')} error={errors.type?.[0]}>
          <Select
            value={type}
            options={DOCUMENT_TYPES.map((value) => ({
              value,
              label: t(`documents.types.${value}`),
            }))}
            onChange={setType}
          />
        </Field>
        <Field label={t('content.source')} error={errors.source?.[0]}>
          <TextInput value={source} onChange={setSource} placeholder="SEMC" mono highlight />
        </Field>
      </div>
      <Field label={t('content.title')} error={errors.title?.[0]}>
        <TextInput value={title} onChange={setTitle} highlight />
      </Field>
      <Field label={t('content.securities')} error={errors.securityIds?.[0]}>
        <SecurityListField
          value={securityIds}
          onChange={setSecurityIds}
          addLabel={t('content.addSecurity')}
          removeLabel={(code) => t('content.removeSecurity', { code })}
        />
      </Field>
      <Field label={t('content.index')} hint={t('content.indexHint')} error={errors.indexCode?.[0]}>
        <Select
          value={indexCode}
          options={[
            { value: '', label: t('content.noIndex') },
            ...indices.map((index) => ({
              value: index.code,
              label: `${index.code} · ${index.name}`,
            })),
          ]}
          onChange={(value: string) => setIndexCode(value)}
        />
      </Field>
      <Field
        label={t('content.country')}
        hint={t('content.countryHint')}
        error={errors.countryCode?.[0]}
      >
        <Select
          value={countryCode}
          options={[
            { value: '', label: t('content.noCountry') },
            ...CEMAC_COUNTRIES.map((code) => ({
              value: code,
              label: `${cemacCode3(code)} · ${format.country(code)}`,
            })),
          ]}
          onChange={(value: string) => setCountryCode(value)}
        />
      </Field>
      <Field
        label={t('content.file')}
        hint={
          document
            ? t('content.keepFile', {
                pages: document.pages,
                size: format.fileSize(document.sizeBytes),
              })
            : undefined
        }
        error={errors.file?.[0]}
      >
        <FileDrop file={file} onChange={setFile} accept=".pdf" maxSize={MAX_PDF_BYTES} />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" busy={save.isPending} disabled={!document && !file}>
          {document ? t('content.saveChanges') : t('content.publish')}
        </Button>
        {save.error && !isApiError(save.error, 400) && (
          <span role="alert" className="font-sans text-data text-down">
            {save.error.message}
          </span>
        )}
      </div>
    </form>
  )
}

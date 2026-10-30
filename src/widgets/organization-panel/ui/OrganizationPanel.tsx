import { clsx } from 'clsx'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { InviteMemberForm, useMemberMenu } from '@/features/manage-members'
import { useMembers, useOrganization } from '@/entities/organization'
import { useCurrentUser } from '@/entities/session'
import type { OrganizationDto, OrganizationMemberDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const helper = createDataColumnHelper<OrganizationMemberDto>()
const getMemberId = (member: OrganizationMemberDto) => member.id

/**
 * CFG, the organisation (spec section 6): its members and the invitations not yet accepted.
 * Administrators invite by e-mail, and change a role or remove a member from the right-click menu.
 */
export function OrganizationPanel() {
  const { t } = useTranslation()
  const member = useCurrentUser().organization !== null
  const organization = useOrganization(member)
  const individual = (
    <p className="p-3 font-sans text-label text-secondary">{t('organization.individual')}</p>
  )

  return (
    <Panel title={t('panels.organization')} code="CFG">
      {member ? (
        <QueryView query={organization}>
          {(data) => (data ? <Members organization={data} /> : individual)}
        </QueryView>
      ) : (
        individual
      )}
    </Panel>
  )
}

function Members({ organization }: { organization: OrganizationDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const members = useMembers(true)
  const admin = organization.myRole === 'admin'
  const { menuOf, dialog, error } = useMemberMenu(admin)

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor((member) => member.displayName ?? member.email, {
          id: 'name',
          header: t('columns.name'),
          meta: { width: '1.3fr' },
          cell: ({ row, getValue }) => (
            <span
              title={row.original.email}
              className={clsx('font-sans', row.original.isSelf && 'text-accent-amber')}
            >
              {getValue()}
              {row.original.isSelf && ` (${t('organization.you')})`}
            </span>
          ),
        }),
        helper.accessor((member) => member.accountType ?? '', {
          id: 'accountType',
          header: t('settings.profile.accountType'),
          cell: ({ row }) =>
            row.original.status === 'invited' ? (
              <span className="font-sans text-warning">
                {t('organization.invitedOn', { date: format.dayMonth(row.original.since) })}
              </span>
            ) : (
              <span className="font-sans text-secondary">
                {row.original.accountType ? t(`accountTypes.${row.original.accountType}`) : ''}
              </span>
            ),
        }),
        helper.accessor('role', {
          header: t('organization.role'),
          meta: { width: '108px' },
          cell: ({ getValue }) => (
            <span className="font-sans">{t(`organization.roles.${getValue()}`)}</span>
          ),
        }),
      ]),
    [t, format],
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <p className="shrink-0 px-3 pt-2 pb-1.5 font-sans text-data text-secondary">
        <span className="font-semibold text-primary">{organization.name}</span>
        {' · '}
        {t('organization.summary', { count: organization.memberCount })}
        {' · '}
        {t(`organization.yourRole.${organization.myRole}`)}
      </p>
      <div className="min-h-0 flex-1">
        <QueryView query={members}>
          {(rows) => (
            <DataTable
              data={rows}
              columns={columns}
              getRowId={getMemberId}
              rowMenu={admin ? menuOf : undefined}
              exportName="cmarket-members"
            />
          )}
        </QueryView>
      </div>
      <div className="flex shrink-0 flex-col gap-1.5 border-t p-2">
        {error && (
          <p role="alert" className="font-sans text-data text-down">
            {error.message}
          </p>
        )}
        {admin ? (
          <>
            <InviteMemberForm />
            <p className="font-sans text-title text-secondary">{t('organization.menuHint')}</p>
          </>
        ) : (
          <p className="font-sans text-data text-secondary">{t('organization.adminsOnly')}</p>
        )}
      </div>
      {dialog}
    </div>
  )
}

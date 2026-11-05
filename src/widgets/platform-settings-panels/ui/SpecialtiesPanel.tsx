import { useTranslation } from 'react-i18next'
import { useAdminSpecialties } from '@/entities/platform-settings'
import { SpecialtiesEditor } from '@/features/edit-platform-settings'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

/** ADMCFG, the closed list of specialties the profiles of the directory pick from. */
export function SpecialtiesPanel() {
  const { t } = useTranslation()
  const specialties = useAdminSpecialties()
  return (
    <Panel title={t('panels.specialties')} code="CFG">
      <QueryView query={specialties}>
        {(data) => <SpecialtiesEditor specialties={data} />}
      </QueryView>
    </Panel>
  )
}

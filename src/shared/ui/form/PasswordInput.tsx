import { Eye, EyeOff } from 'lucide-react'
import { useState, type ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { TextInput } from './TextInput'

type PasswordInputProps = Omit<ComponentProps<typeof TextInput>, 'type' | 'trailing' | 'mono'>

/** A password, hidden unless the user shows it. */
export function PasswordInput(props: PasswordInputProps) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const Icon = visible ? EyeOff : Eye
  return (
    <TextInput
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? t('form.hidePassword') : t('form.showPassword')}
          aria-pressed={visible}
          className="shrink-0 text-secondary hover:text-primary"
        >
          <Icon aria-hidden className="size-3.5" />
        </button>
      }
    />
  )
}

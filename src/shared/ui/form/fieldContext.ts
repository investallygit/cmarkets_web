import { createContext, useContext } from 'react'

export interface FieldContextValue {
  /** id of the control, targeted by the field label. */
  controlId: string
  /** id of the label, for groups of controls (radio buttons) that a <label> cannot target. */
  labelId: string
  /** ids of the hint and error, for aria-describedby. */
  describedBy?: string
  invalid: boolean
}

export const FieldContext = createContext<FieldContextValue | null>(null)

/** Label, hint and error ids of the enclosing <Field>, if any. */
export function useField(): FieldContextValue | null {
  return useContext(FieldContext)
}

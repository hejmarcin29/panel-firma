'use client'

import type { ComponentProps } from 'react'

import {
  InstallationForm,
  type ClientOption,
  type InstallationFormInitialValues,
  type InstallationFormScope,
  type SelectOption,
  type StatusOption,
} from '../_components/installation-form'
import { createInstallationAction } from '../actions'

export type { ClientOption, InstallationFormInitialValues, InstallationFormScope, SelectOption, StatusOption }

type NewInstallationFormProps = Omit<
  ComponentProps<typeof InstallationForm>,
  'mode' | 'actionFunction'
> & {
  scope?: InstallationFormScope
}

export function NewInstallationForm({ scope = 'standard', ...rest }: NewInstallationFormProps) {
  return (
    <InstallationForm
      mode="create"
      scope={scope}
      actionFunction={createInstallationAction}
      {...rest}
    />
  )
}

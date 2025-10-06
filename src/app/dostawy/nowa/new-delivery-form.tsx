'use client'

import type { ComponentProps } from 'react'

import {
  DeliveryForm,
  type ClientOption,
  type DeliveryFormInitialValues,
  type OptionItem,
  type SelectOption,
} from '../_components/delivery-form'
import { createDeliveryAction } from '../actions'

export type { ClientOption, DeliveryFormInitialValues, OptionItem, SelectOption }

type NewDeliveryFormProps = Omit<ComponentProps<typeof DeliveryForm>, 'mode' | 'actionFunction'>

export function NewDeliveryForm(props: NewDeliveryFormProps) {
  return <DeliveryForm mode="create" actionFunction={createDeliveryAction} {...props} />
}

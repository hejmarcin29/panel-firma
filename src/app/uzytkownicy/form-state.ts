'use client'

import type {
	ChangeUserPasswordFormState,
	CreateUserFormState,
	UpdateUserFormState,
} from '@/lib/users/schemas'

export const INITIAL_CREATE_USER_FORM_STATE: CreateUserFormState = { status: 'idle' }
export const INITIAL_UPDATE_USER_FORM_STATE: UpdateUserFormState = { status: 'idle' }
export const INITIAL_CHANGE_USER_PASSWORD_FORM_STATE: ChangeUserPasswordFormState = { status: 'idle' }

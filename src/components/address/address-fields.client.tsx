"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export type AddressFieldsProps = {
  // RHF register helper (accepts react-hook-form register signature)
  register: (name: any, options?: any) => any
  // Minimal error shape we read in this component
  errors?: Record<string, { message?: string } | undefined>
  prefix?: string // e.g., 'invoice'
  // Visual mask for postal code 00-000; validation remains in Zod
  maskPostal?: boolean
}

export function AddressFields({ register, errors, prefix = '', maskPostal }: AddressFieldsProps) {
  const n = (field: string) => (prefix ? `${prefix}${field}` : field)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <Label>Kod pocztowy</Label>
        <Input
          {...register(n('PostalCode'), maskPostal
            ? {
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 5)
                  const formatted = digits.length <= 2 ? digits : `${digits.slice(0, 2)}-${digits.slice(2)}`
                  e.target.value = formatted
                },
              }
            : undefined)}
          placeholder="00-000"
          inputMode="numeric"
        />
        {errors?.[n('PostalCode')]?.message && <p className="text-sm text-red-600">{errors[n('PostalCode')]!.message}</p>}
      </div>
      <div>
        <Label>Miejscowość</Label>
        <Input {...register(n('City'))} />
        {errors?.[n('City')]?.message && <p className="text-sm text-red-600">{errors[n('City')]!.message}</p>}
      </div>
      <div>
        <Label>Adres (ulica i numer, opcjonalnie lokal/piętro)</Label>
        <Input {...register(n('Address'))} placeholder="np. Długa 12/5, klatka A, II piętro" />
        {errors?.[n('Address')]?.message && <p className="text-sm text-red-600">{errors[n('Address')]!.message}</p>}
      </div>
    </div>
  )
}

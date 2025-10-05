import { z } from "zod";

export const partnerStatuses = [
  "STRATEGICZNY",
  "AKTYWNY",
  "ROZWOJOWY",
  "WSTRZYMANY",
] as const;

export type PartnerStatusOption = (typeof partnerStatuses)[number];

export const partnerStatusLabels: Record<PartnerStatusOption, string> = {
  STRATEGICZNY: "Strategiczny",
  AKTYWNY: "Aktywny",
  ROZWOJOWY: "Rozwojowy",
  WSTRZYMANY: "Wstrzymany",
};

const optionalString = z
  .string()
  .trim()
  .min(1)
  .max(256)
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalEmail = z
  .string()
  .trim()
  .email("Podaj prawidłowy adres e-mail.")
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalPhone = z
  .string()
  .trim()
  .min(3, "Podaj numer telefonu zawierający co najmniej 3 znaki.")
  .max(32, "Numer telefonu jest zbyt długi.")
  .optional()
  .transform((value) => (value ? value : undefined));

export const basePartnerSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(3, "Nazwa partnera musi mieć co najmniej 3 znaki.")
    .max(160, "Nazwa partnera jest zbyt długa."),
  segment: optionalString,
  region: optionalString,
  contactName: optionalString,
  contactEmail: optionalEmail,
  contactPhone: optionalPhone,
  taxId: optionalString,
  phone: optionalPhone,
  email: optionalEmail,
  notes: z
    .string()
    .trim()
    .max(2000, "Notatki mogą mieć maksymalnie 2000 znaków.")
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export const createPartnerSchema = basePartnerSchema.extend({
  status: z.enum(partnerStatuses).optional(),
});

export const updatePartnerSchema = basePartnerSchema.partial().extend({
  status: z.enum(partnerStatuses).optional(),
});

export const changePartnerStatusSchema = z.object({
  status: z.enum(partnerStatuses),
  comment: z
    .string()
    .trim()
    .max(500, "Komentarz może mieć maksymalnie 500 znaków.")
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export const archivePartnerSchema = z.object({
  archived: z.boolean(),
  reason: z
    .string()
    .trim()
    .max(500, "Powód archiwizacji może mieć maksymalnie 500 znaków.")
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export type CreatePartnerInput = z.infer<typeof createPartnerSchema>;
export type UpdatePartnerInput = z.infer<typeof updatePartnerSchema>;
export type ChangePartnerStatusInput = z.infer<typeof changePartnerStatusSchema>;
export type ArchivePartnerInput = z.infer<typeof archivePartnerSchema>;

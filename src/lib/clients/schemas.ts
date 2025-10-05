import { z } from "zod";

const nullableString = z.union([z.string().min(1), z.literal(null)]).optional();
const looseNullableString = z.union([z.string(), z.literal(null)]).optional();

export const ACQUISITION_SOURCE_OPTIONS = [
  { value: "referral", label: "Polecenie od klienta" },
  { value: "marketing_campaign", label: "Kampania marketingowa" },
  { value: "event", label: "Event lub targi" },
  { value: "partner", label: "Partner sprzedażowy" },
  { value: "other", label: "Inne" },
] as const;

const acquisitionSourceEnum = z.enum(ACQUISITION_SOURCE_OPTIONS.map((option) => option.value) as [string, ...string[]]);

export const createClientSchema = z
  .object({
    fullName: z.string().min(3, "Podaj imię i nazwisko klienta."),
    partnerId: nullableString,
    email: looseNullableString,
    phone: looseNullableString,
    city: looseNullableString,
    street: looseNullableString,
    postalCode: looseNullableString,
    acquisitionSource: z.union([acquisitionSourceEnum, z.literal(null)]).optional(),
    additionalInfo: looseNullableString,
  })
  .superRefine((data, ctx) => {
    if (data.acquisitionSource === "partner" && !data.partnerId) {
      ctx.addIssue({
        path: ["partnerId"],
        code: z.ZodIssueCode.custom,
        message: "Wybierz partnera, jeśli klient pochodzi od partnera.",
      });
    }
  });

export type CreateClientInput = z.infer<typeof createClientSchema>;

export type CreateClientFormErrors = Partial<Record<keyof CreateClientInput, string>>;

export type CreateClientFormState =
  | { status: "idle" }
  | { status: "error"; message?: string; errors?: CreateClientFormErrors };

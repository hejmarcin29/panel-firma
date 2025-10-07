import { z } from "zod";

import { deliveryTimingTypes } from "@db/schema";

const nullableString = z.union([z.string().min(1), z.literal(null)]).optional();
const looseNullableString = z.union([z.string(), z.literal(null)]).optional();
const nullableDate = z.union([z.date(), z.literal(null)]).default(null);
const nullableNumber = z
  .number()
  .refine(Number.isFinite, { message: "Wprowadź poprawną liczbę." })
  .min(0, "Wartość nie może być ujemna.")
  .optional()
  .nullable();
const nullablePercent = z
  .number()
  .refine(Number.isFinite, { message: "Wprowadź poprawną liczbę." })
  .min(0, "Wartość nie może być ujemna.")
  .max(100, "Wartość nie może przekraczać 100%.")
  .optional()
  .nullable();
const nullableInteger = z
  .number()
  .refine(Number.isFinite, { message: "Wprowadź poprawną liczbę." })
  .int("Podaj liczbę całkowitą.")
  .min(0, "Wartość nie może być ujemna.")
  .optional()
  .nullable();

const measurementCoreSchema = z.object({
  orderId: z.string().min(1, "Wybierz zlecenie."),
  measuredById: nullableString,
  scheduledAt: nullableDate,
  measuredAt: nullableDate,
  measuredFloorArea: nullableNumber,
  measuredBaseboardLength: nullableNumber,
  offcutPercent: nullablePercent,
  additionalNotes: looseNullableString,
  panelProductId: nullableString,
  deliveryTimingType: z.enum(deliveryTimingTypes),
  deliveryDaysBefore: nullableInteger,
  deliveryDate: nullableDate,
});

type MeasurementCoreInput = z.infer<typeof measurementCoreSchema>;

function validateMeasurementTiming<T extends MeasurementCoreInput>(data: T, ctx: z.RefinementCtx) {
  if (data.deliveryTimingType === "DAYS_BEFORE") {
    if (data.deliveryDaysBefore == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deliveryDaysBefore"],
        message: "Podaj liczbę dni przed montażem.",
      });
    }
  } else if (data.deliveryTimingType === "EXACT_DATE") {
    if (!data.deliveryDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deliveryDate"],
        message: "Wybierz termin dostawy.",
      });
    }
  }

  if (data.measuredAt && data.scheduledAt && data.measuredAt < data.scheduledAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["measuredAt"],
      message: "Data pomiaru nie może być wcześniejsza niż planowany termin.",
    });
  }
}

export const createMeasurementSchema = measurementCoreSchema.superRefine(validateMeasurementTiming);

export type CreateMeasurementInput = z.infer<typeof createMeasurementSchema>;

export type CreateMeasurementFormErrors = Partial<Record<keyof CreateMeasurementInput | "files", string>> & {
  measurementId?: string;
};

export type CreateMeasurementFormState =
  | { status: "idle" }
  | { status: "error"; message?: string; errors?: CreateMeasurementFormErrors }
  | { status: "success"; measurementId: string; message?: string };

export const updateMeasurementSchema = createMeasurementSchema.safeExtend({
  measurementId: z.string().min(1, "Brakuje identyfikatora pomiaru."),
});

export type UpdateMeasurementInput = z.infer<typeof updateMeasurementSchema>;

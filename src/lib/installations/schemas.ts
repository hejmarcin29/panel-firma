import { z } from "zod";

import { installationStatuses } from "@db/schema";

const nullableString = z.union([z.string().min(1), z.literal(null)]).optional();
const looseNullableString = z.union([z.string(), z.literal(null)]).optional();
const nullableDate = z.union([z.date(), z.literal(null)]).default(null);

export const createInstallationSchema = z
  .object({
    orderId: nullableString,
    clientId: nullableString,
    assignedInstallerId: nullableString,
    status: z.enum(installationStatuses).default("PLANNED"),
    scheduledStartAt: nullableDate,
    scheduledEndAt: nullableDate,
    actualStartAt: nullableDate,
    actualEndAt: nullableDate,
    addressStreet: looseNullableString,
    addressCity: looseNullableString,
    addressPostalCode: looseNullableString,
    locationPinUrl: looseNullableString,
    panelProductId: nullableString,
    baseboardProductId: nullableString,
    additionalWork: looseNullableString,
    additionalInfo: looseNullableString,
    customerNotes: looseNullableString,
    handoverProtocolSigned: z.boolean().default(false),
    reviewReceived: z.boolean().default(false),
    requiresAdminAttention: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (!data.orderId && !data.clientId) {
      ctx.addIssue({
        path: ["clientId"],
        code: z.ZodIssueCode.custom,
        message: "Wybierz klienta.",
      });
    }
  });

export type CreateInstallationInput = z.infer<typeof createInstallationSchema>;

export const updateInstallationSchema = createInstallationSchema.safeExtend({
  installationId: z.string().min(1, "Brakuje identyfikatora montażu."),
});

export type CreateInstallationFormErrors = Partial<Record<keyof CreateInstallationInput, string>> & {
  orderId?: string;
  clientId?: string;
  installationId?: string;
  scheduleMeasurement?: string;
  measurementScheduledAt?: string;
  measurementMeasuredById?: string;
  measurementDeliveryTimingType?: string;
  measurementDeliveryDaysBefore?: string;
  measurementDeliveryDate?: string;
  measurementAdditionalNotes?: string;
};

export type CreateInstallationFormState =
  | { status: "idle" }
  | { status: "error"; message?: string; errors?: CreateInstallationFormErrors };

export type UpdateInstallationInput = z.infer<typeof updateInstallationSchema>;

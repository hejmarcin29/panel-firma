import { z } from "zod";

import { deliveryStages, deliveryTypes } from "@db/schema";

const nullableString = z.union([z.string().min(1), z.literal(null)]).optional();
const looseNullableString = z.union([z.string(), z.literal(null)]).optional();
const nullableDate = z.union([z.date(), z.literal(null)]).default(null);

export const createDeliverySchema = z
  .object({
    type: z.enum(deliveryTypes),
    clientId: z.string().min(1, "Wybierz klienta."),
    orderId: nullableString,
    installationId: nullableString,
    stage: z.enum(deliveryStages).default("RECEIVED"),
    scheduledDate: nullableDate,
    includePanels: z.boolean().default(false),
    panelProductId: nullableString,
    panelStyle: looseNullableString,
    includeBaseboards: z.boolean().default(false),
    baseboardProductId: nullableString,
    shippingAddressStreet: looseNullableString,
    shippingAddressCity: looseNullableString,
    shippingAddressPostalCode: looseNullableString,
    notes: looseNullableString,
    proformaIssued: z.boolean().default(false),
    depositOrFinalInvoiceIssued: z.boolean().default(false),
    shippingOrdered: z.boolean().default(false),
    reviewReceived: z.boolean().default(false),
    requiresAdminAttention: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.type === "FOR_INSTALLATION" && !data.installationId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["installationId"],
        message: "Wybierz montaż powiązany z dostawą.",
      });
    }

    if (data.includePanels && !data.panelProductId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["panelProductId"],
        message: "Wybierz produkt paneli lub odznacz opcję dostawy paneli.",
      });
    }

    if (data.includeBaseboards && !data.baseboardProductId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["baseboardProductId"],
        message: "Wybierz produkt listew lub odznacz opcję dostawy listew.",
      });
    }
  });

export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;

export type CreateDeliveryFormErrors = Partial<Record<keyof CreateDeliveryInput, string>> & {
  clientId?: string;
};

export type CreateDeliveryFormState =
  | { status: "idle" }
  | { status: "error"; message?: string; errors?: CreateDeliveryFormErrors };

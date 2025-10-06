import { z } from "zod";

import { orderExecutionModes, orderStages } from "@db/schema";

const nullableString = z.union([z.string().min(1), z.literal(null)]).optional();

const nullableLooseString = z.union([z.string(), z.literal(null)]).optional();

export const createOrderSchema = z.object({
  clientId: z.string().min(1, "Wybierz klienta."),
  partnerId: nullableString,
  ownerId: nullableString,
  orderNumber: nullableString,
  executionMode: z.enum(orderExecutionModes).default("INSTALLATION_ONLY"),
  title: nullableString,
  stage: z.enum(orderStages).default("RECEIVED"),
  stageNotes: nullableLooseString,
  declaredFloorArea: z.union([z.number().nonnegative(), z.literal(null)]).default(null),
  declaredBaseboardLength: z.union([z.number().nonnegative(), z.literal(null)]).default(null),
  buildingType: nullableLooseString,
  panelPreference: nullableLooseString,
  baseboardPreference: nullableLooseString,
  preferredPanelProductId: nullableString,
  preferredBaseboardProductId: nullableString,
  requiresAdminAttention: z.boolean().default(false),
  quoteSent: z.boolean().default(false),
  depositInvoiceIssued: z.boolean().default(false),
  finalInvoiceIssued: z.boolean().default(false),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export type CreateOrderFormErrors = Partial<Record<keyof CreateOrderInput, string>> & {
  clientId?: string;
};

export type CreateOrderFormState =
  | { status: "idle" }
  | { status: "error"; message?: string; errors?: CreateOrderFormErrors };

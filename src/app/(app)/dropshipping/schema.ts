import { z } from "zod";

import { DROPSHIPPING_CHANNEL_OPTIONS, DROPSHIPPING_STAGE_OPTIONS } from "@/lib/dropshipping/constants";

const dropshippingItemSchema = z.object({
  title: z.string().min(2, "Dodaj nazwę pozycji"),
  packagesCount: z.number().int().min(0, "Podaj liczbę opakowań"),
  areaM2: z.number().min(0, "Podaj powierzchnię w m²").nullable(),
  pricePerPackage: z.number().min(0, "Podaj cenę za opakowanie"),
  pricePerSquareMeter: z.number().min(0, "Podaj cenę za m²"),
});

export const createDropshippingOrderSchema = z.object({
  clientName: z.string().min(2, "Podaj nazwę klienta"),
  channel: z.enum(DROPSHIPPING_CHANNEL_OPTIONS.map((option) => option.value) as [string, ...string[]]),
  channelReference: z.string().nullish(),
  vatRate: z.enum(["0", "8", "23"]),
  supplier: z.string().min(2, "Podaj dostawcę"),
  notes: z.string().nullish(),
  items: z.array(dropshippingItemSchema).min(1, "Dodaj przynajmniej jedną pozycję"),
});

export type CreateDropshippingOrderInput = z.infer<typeof createDropshippingOrderSchema>;

export const updateDropshippingStageSchema = z.object({
  orderId: z.number().int(),
  stage: z.enum(DROPSHIPPING_STAGE_OPTIONS.map((option) => option.value) as [string, ...string[]]),
});

export const toggleChecklistItemSchema = z.object({
  orderId: z.number().int(),
  itemId: z.number().int(),
});

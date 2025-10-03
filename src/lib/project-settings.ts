import { z } from "zod";

export const defaultChecklistLabels = {
  delivery: {
    proforma: "Faktura proforma",
    advance_invoice: "Faktura zaliczkowa",
    final_invoice: "Faktura końcowa",
    post_delivery_invoice: "FV (płatność po dostawie)",
    quote: "Wycena",
    done: "Koniec",
  },
  installation: {
    measurement: "Pomiar",
    quote: "Wycena",
    contract: "Umowa",
    advance_payment: "Zaliczka",
    installation: "Montaż",
    handover_protocol: "Protokół odbioru",
    final_invoice: "Faktura końcowa",
    done: "Koniec",
  },
} as const;

export const defaultPipelineStageLabels: Record<string, string> = {
  // delivery
  offer_sent: "Wysłana oferta",
  awaiting_payment: "Czeka na wpłatę",
  delivery: "Dostawa",
  final_invoice_issued: "Wystawiona faktura końcowa",
  // installation
  awaiting_measurement: "Czeka na pomiar",
  awaiting_quote: "Czeka na wycenę",
  before_contract: "Przed umową",
  before_advance: "Przed zaliczką",
  before_installation: "Przed montażem",
  before_final_invoice: "Przed fakturą końcową",
  done: "Koniec",
};

export const defaultPipelineStages = {
  delivery: [
    { key: "offer_sent", label: defaultPipelineStageLabels.offer_sent },
    { key: "awaiting_payment", label: defaultPipelineStageLabels.awaiting_payment },
    { key: "delivery", label: defaultPipelineStageLabels.delivery },
    { key: "final_invoice_issued", label: defaultPipelineStageLabels.final_invoice_issued },
    { key: "done", label: defaultPipelineStageLabels.done },
  ],
  installation: [
    { key: "awaiting_measurement", label: defaultPipelineStageLabels.awaiting_measurement },
    { key: "awaiting_quote", label: defaultPipelineStageLabels.awaiting_quote },
    { key: "before_contract", label: defaultPipelineStageLabels.before_contract },
    { key: "before_advance", label: defaultPipelineStageLabels.before_advance },
    { key: "before_installation", label: defaultPipelineStageLabels.before_installation },
    { key: "before_final_invoice", label: defaultPipelineStageLabels.before_final_invoice },
    { key: "done", label: defaultPipelineStageLabels.done },
  ],
} as const;

export const projectSettingsSchema = z.object({
  invoiceInfoText: z
    .string()
    .default(
      [
        "Primepodloga.pl Marcin Przybyła",
        "Koszalińska 38A",
        "47-400 Racibórz",
        "NIP: 6392026404",
        "Alior Bank",
        "27249000050000453000562099",
        "",
        "tytułem: Usługa montażu paneli winylowych - budynek mieszkalny",
        "jednorodzinny",
        "",
        "W uwagach",
        "numer zlecenia np. 23_1_m",
      ].join("\n"),
    )
    .optional(),
  checklistLabels: z
    .object({
      delivery: z
        .record(z.string(), z.string())
        .default({ ...defaultChecklistLabels.delivery }),
      installation: z
        .record(z.string(), z.string())
        .default({ ...defaultChecklistLabels.installation }),
    })
    .optional()
    .default({
      delivery: { ...defaultChecklistLabels.delivery },
      installation: { ...defaultChecklistLabels.installation },
    }),
  pipelineStageLabels: z
    .record(z.string(), z.string())
    .optional()
    .default({ ...defaultPipelineStageLabels }),
  pipelineStages: z
    .object({
      delivery: z
        .array(z.object({ key: z.string().min(1), label: z.string().min(1) }))
        .default([...defaultPipelineStages.delivery]),
      installation: z
        .array(z.object({ key: z.string().min(1), label: z.string().min(1) }))
        .default([...defaultPipelineStages.installation]),
    })
    .optional()
    .default({
      delivery: [...defaultPipelineStages.delivery],
      installation: [...defaultPipelineStages.installation],
    }),
  // Automatyzacje: sugerowane reguły on/off + parametry proste
  automations: z
    .object({
      autoCreateGoogleEventOnSchedule: z.boolean().default(true),
      autoUpdateGoogleEventOnChange: z.boolean().default(true),
      autoDeleteGoogleEventOnUnassign: z.boolean().default(true),
      notifyInstallerOnAssignment: z.boolean().default(false),
      notifyClientOnSchedule: z.boolean().default(false),
      warnIfStageInvalid: z.boolean().default(true),
    })
    .optional()
    .default({
      autoCreateGoogleEventOnSchedule: true,
      autoUpdateGoogleEventOnChange: true,
      autoDeleteGoogleEventOnUnassign: true,
      notifyInstallerOnAssignment: false,
      notifyClientOnSchedule: false,
      warnIfStageInvalid: true,
    }),
});

export type ProjectSettings = z.infer<typeof projectSettingsSchema>;

export function mergeProjectSettings(partial?: Partial<ProjectSettings> | null): ProjectSettings {
  const base = projectSettingsSchema.parse({});
  if (!partial) return base;

  // Merge checklist labels by branch
  const checklistLabels = {
    delivery: { ...base.checklistLabels.delivery, ...(partial.checklistLabels?.delivery ?? {}) },
    installation: { ...base.checklistLabels.installation, ...(partial.checklistLabels?.installation ?? {}) },
  };

  // Determine pipeline stages arrays (source of truth for keys and order)
  let deliveryStages = partial.pipelineStages?.delivery ?? base.pipelineStages.delivery;
  let installationStages = partial.pipelineStages?.installation ?? base.pipelineStages.installation;

  // If only labels map provided (legacy), overlay labels onto current arrays
  const labelsOverlay = partial.pipelineStageLabels ?? {};
  if (labelsOverlay && Object.keys(labelsOverlay).length > 0) {
    const apply = (arr: { key: string; label: string }[]) =>
      arr.map((e) => ({ ...e, label: labelsOverlay[e.key] ?? e.label }));
    deliveryStages = apply(deliveryStages);
    installationStages = apply(installationStages);
  }

  // Build labels mapping from final arrays
  const pipelineStageLabels: Record<string, string> = {};
  for (const e of [...deliveryStages, ...installationStages]) {
    pipelineStageLabels[e.key] = e.label;
  }
  // Preserve labels for legacy keys (orders may still carry them)
  for (const [k, v] of Object.entries(labelsOverlay)) {
    if (!(k in pipelineStageLabels)) pipelineStageLabels[k] = v;
  }

  return {
    invoiceInfoText: partial.invoiceInfoText ?? base.invoiceInfoText,
    checklistLabels,
    pipelineStageLabels,
    pipelineStages: { delivery: deliveryStages, installation: installationStages },
    automations: partial.automations ?? base.automations,
  };
}

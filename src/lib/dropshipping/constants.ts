export const DROPSHIPPING_STAGE_OPTIONS = [
  { value: "LEAD", label: "Lead" },
  { value: "PROFORMA_WYSLANA", label: "Proforma wysłana" },
  { value: "ZALICZKA_OPLACONA", label: "Zaliczka opłacona" },
  { value: "ZAMOWIENIE_DO_DOSTAWCY", label: "Zamówienie do dostawcy" },
  { value: "DOSTAWA_POTWIERDZONA", label: "Dostawa potwierdzona" },
  { value: "FAKTURA_KONCOWA", label: "Faktura końcowa" },
] as const;

export const DROPSHIPPING_STAGE_LABELS = Object.fromEntries(
  DROPSHIPPING_STAGE_OPTIONS.map(({ value, label }) => [value, label]),
) as Record<string, string>;

export const DROPSHIPPING_STAGE_DATE_FIELDS: Record<string, keyof DropshippingStageDates | null> = {
  LEAD: null,
  PROFORMA_WYSLANA: "proformaIssuedAt",
  ZALICZKA_OPLACONA: "depositPaidAt",
  ZAMOWIENIE_DO_DOSTAWCY: "supplierOrderAt",
  DOSTAWA_POTWIERDZONA: "deliveryConfirmedAt",
  FAKTURA_KONCOWA: "finalInvoiceAt",
};

export interface DropshippingStageDates {
  proformaIssuedAt?: Date | null;
  depositPaidAt?: Date | null;
  supplierOrderAt?: Date | null;
  deliveryConfirmedAt?: Date | null;
  finalInvoiceAt?: Date | null;
}

export const DROPSHIPPING_CHANNEL_OPTIONS = [
  { value: "WORDPRESS", label: "WordPress" },
  { value: "EMAIL", label: "E-mail" },
  { value: "INNE", label: "Inne" },
] as const;

export const DROPSHIPPING_CHECKLIST_TEMPLATE: {
  title: string;
  description?: string;
  isOptional?: boolean;
}[] = [
  {
    title: "Wysłać proformę do klienta",
    description: "Przygotuj ofertę z listą towarów i terminem płatności",
  },
  {
    title: "Zaksięgować zaliczkę",
    description: "Sprawdź wpływ na koncie i zaktualizuj status w panelu",
  },
  {
    title: "Przekazać zamówienie do dostawcy",
    description: "Wyślij potwierdzenie zamówienia do hurtowni/producenta",
  },
  {
    title: "Potwierdzić dostawę",
    description: "Zweryfikuj kompletność towarów i terminy wysyłki",
  },
  {
    title: "Wystawić fakturę końcową",
    description: "Utwórz dokument sprzedaży po potwierdzeniu realizacji",
  },
  {
    title: "Przekazać dokumenty klientowi",
    description: "Wyślij fakturę i potwierdzenie wysyłki do klienta",
    isOptional: true,
  },
];

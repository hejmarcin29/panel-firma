import type { OrderStage } from "@db/schema";

export const orderStageSequence: OrderStage[] = [
  "RECEIVED",
  "BEFORE_MEASUREMENT",
  "BEFORE_QUOTE",
  "AWAITING_DEPOSIT",
  "BEFORE_DELIVERY",
  "BEFORE_INSTALLATION",
  "AWAITING_FINAL_PAYMENT",
  "COMPLETED",
];

export const orderStageLabels: Record<OrderStage, string> = {
  RECEIVED: "Przyjęto zlecenie",
  BEFORE_MEASUREMENT: "Przed pomiarem",
  BEFORE_QUOTE: "Przed wyceną",
  AWAITING_DEPOSIT: "Oczekiwanie na wpłatę zaliczki",
  BEFORE_DELIVERY: "Przed dostawą",
  BEFORE_INSTALLATION: "Przed montażem",
  AWAITING_FINAL_PAYMENT: "Oczekiwanie na wpłatę końcowej",
  COMPLETED: "Koniec",
};

/**
 * Krótsze etykiety etapów dla montera - bardziej operacyjne
 */
export const orderStageLabelsShort: Record<OrderStage, string> = {
  RECEIVED: "Przyjęto",
  BEFORE_MEASUREMENT: "Pomiar",
  BEFORE_QUOTE: "Wycena",
  AWAITING_DEPOSIT: "Zaliczka",
  BEFORE_DELIVERY: "Dostawa",
  BEFORE_INSTALLATION: "Montaż",
  AWAITING_FINAL_PAYMENT: "Końcówka",
  COMPLETED: "Zakończono",
};

export const orderStageBadgeClasses: Partial<Record<OrderStage, string>> = {
  RECEIVED: "bg-muted text-foreground",
  BEFORE_MEASUREMENT: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-200",
  BEFORE_QUOTE: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-100",
  AWAITING_DEPOSIT: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-100",
  BEFORE_DELIVERY: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-100",
  BEFORE_INSTALLATION: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-100",
  AWAITING_FINAL_PAYMENT: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-100",
  COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100",
};

export const getOrderStageLabel = (stage: OrderStage) => orderStageLabels[stage];

export const orderStageDescriptions: Partial<Record<OrderStage, string>> = {
  RECEIVED: "Zamówienie zostało wprowadzone do systemu.",
  BEFORE_MEASUREMENT: "Czekamy na potwierdzenie terminu pomiaru.",
  BEFORE_QUOTE: "Trwa przygotowanie lub akceptacja wyceny.",
  AWAITING_DEPOSIT: "Wymagana wpłata zaliczki od klienta.",
  BEFORE_DELIVERY: "Zestaw dostawczy przygotowywany do wysyłki.",
  BEFORE_INSTALLATION: "Zespół montażowy przygotowuje się do montażu.",
  AWAITING_FINAL_PAYMENT: "Oczekiwanie na końcową płatność po montażu.",
  COMPLETED: "Zlecenie zakończone i rozliczone.",
};

export const getOrderStageIndex = (stage: OrderStage) =>
  Math.max(0, orderStageSequence.indexOf(stage));

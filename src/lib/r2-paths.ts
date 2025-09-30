export type R2Category =
  | "invoices"
  | "contracts"
  | "protocols"
  | "offers"
  | "photos"
  | "measurements"
  | "installs"
  | "deliveries"
  | "payments"
  | "warranty"
  | "other";

export function toYYYYMMDD(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export function toYYYY_MM(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return { yyyy: String(y), mm: m };
}

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function safeExtFromFilename(filename?: string) {
  const ext = filename?.split(".").pop()?.toLowerCase();
  if (!ext) return "";
  return ext.replace(/[^a-z0-9]/g, "");
}

export function buildClientBasedKey(opts: {
  clientNo: string;
  clientName: string;
  category: R2Category;
  title?: string;
  version?: number;
  date?: Date;
  filename?: string;
  includeClientInFilename?: boolean;
}) {
  const { yyyy, mm } = toYYYY_MM(opts.date);
  const clientSlug = `${opts.clientNo}-${slugify(opts.clientName)}`;
  const datePart = toYYYYMMDD(opts.date);
  const title = opts.title ? slugify(opts.title) : undefined;
  const v =
    typeof opts.version === "number"
      ? String(opts.version).padStart(2, "0")
      : "01";
  const ext = safeExtFromFilename(opts.filename);
  const base = title ? `${datePart}__${title}__v${v}` : `${datePart}__v${v}`;
  const nameCore = opts.includeClientInFilename
    ? `${base}__${slugify(opts.clientName)}`
    : base;
  const file = ext ? `${nameCore}.${ext}` : nameCore;
  const prefix = `clients/${clientSlug}/${yyyy}/${mm}/${opts.category}/`;
  return { key: `${prefix}${file}`, prefix, file };
}

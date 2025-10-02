export function formatCityPostalAddress(
  city?: string | null,
  postal?: string | null,
  address?: string | null,
): string {
  const c = (city ?? "").trim();
  const p = (postal ?? "").trim();
  const a = (address ?? "").trim();
  if (!c && !p && !a) return "—";
  const left = [p, c].filter(Boolean).join(" ");
  return a ? `${left}, ${a}` : left || "—";
}

export function formatInvoiceLine(
  postal?: string | null,
  city?: string | null,
  address?: string | null,
): string {
  // convenience wrapper matching common call order in invoice contexts
  const p = (postal ?? "").trim();
  const c = (city ?? "").trim();
  const a = (address ?? "").trim();
  if (!c && !p && !a) return "—";
  const left = [p, c].filter(Boolean).join(" ");
  return a ? `${left}, ${a}` : left || "—";
}

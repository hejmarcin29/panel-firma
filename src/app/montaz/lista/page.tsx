export const metadata = { title: "Montaż" };
import OrdersPage from "@/app/zlecenia/page";

// Typ-locked wrapper: wymuszamy type=installation i ukrywamy filtr typu
type SearchParams = Record<string, string | string[] | undefined>;

export default function MontazListWrapper(props: { searchParams: SearchParams }) {
  const sp = props.searchParams || {};
  return (
    // @ts-expect-error Next.js 15 App Router: dynamic route accepts Promise searchParams
    <OrdersPage searchParams={Promise.resolve({ ...sp, type: "installation", view: sp.view ?? "cards" })} />
  );
}

export const metadata = { title: "Dostawa" };
import OrdersPage from "@/app/zlecenia/page";

type SearchParams = Record<string, string | string[] | undefined>;

export default function DostawaListWrapper(props: { searchParams: SearchParams }) {
  const sp = props.searchParams || {};
  return (
    // Wymuszamy type=delivery i używamy tej samej strony listy
    // @ts-expect-error Next.js 15 App Router: dynamic route accepts Promise searchParams
    <OrdersPage searchParams={Promise.resolve({ ...sp, type: "delivery", view: sp.view ?? "cards" })} />
  );
}

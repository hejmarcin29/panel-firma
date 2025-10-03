export const metadata = { title: "Dostawa" };
import OrdersPage from "@/app/zlecenia/page";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function DostawaListWrapper(props: { searchParams: Promise<SearchParams> }) {
  const sp = { ...(await props.searchParams) };
  const view = (sp.view as string | undefined) ?? "cards";
  // Wymuszamy type=delivery i używamy tej samej strony listy
  return <OrdersPage searchParams={Promise.resolve({ ...sp, type: "delivery", view })} />;
}

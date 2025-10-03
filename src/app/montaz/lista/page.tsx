export const metadata = { title: "Montaż" };
import OrdersPage from "@/app/zlecenia/page";

// Typ-locked wrapper: wymuszamy type=installation i ukrywamy filtr typu
type SearchParams = Record<string, string | string[] | undefined>;

export default async function MontazListWrapper(props: { searchParams: Promise<SearchParams> }) {
  const sp = { ...(await props.searchParams) };
  const view = (sp.view as string | undefined) ?? "cards";
  return <OrdersPage searchParams={Promise.resolve({ ...sp, type: "installation", view })} />;
}

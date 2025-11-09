export interface DashboardKpi {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
}

export interface DashboardOrderRow {
  id: string;
  customer: string;
  status: string;
  items: number;
  value: string;
}

export const kpis: DashboardKpi[] = [];

export const dropshippingOrders: DashboardOrderRow[] = [];

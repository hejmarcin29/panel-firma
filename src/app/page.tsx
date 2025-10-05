import { DashboardOverview } from "./_components/dashboard-overview";
import { getOrdersDashboardData } from "@/lib/orders";
import { getUsersMetrics } from "@/lib/users";

export const metadata = {
  title: "Dashboard",
  description: "Centrum dowodzenia operacjami panelu.",
};

export default async function HomePage() {
  const [dashboardData, usersMetrics] = await Promise.all([
    getOrdersDashboardData(20),
    getUsersMetrics(),
  ]);

  const { metrics, stageDistribution, orders } = dashboardData;
  const serializedOrders = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    title: order.title,
    clientName: order.clientName,
    clientCity: order.clientCity,
    partnerName: order.partnerName,
    stage: order.stage,
    stageNotes: order.stageNotes,
    stageChangedAt: order.stageChangedAt.toISOString(),
    requiresAdminAttention: order.requiresAdminAttention,
    pendingTasks: order.pendingTasks,
    scheduledInstallationDate: order.scheduledInstallationDate
      ? order.scheduledInstallationDate.toISOString()
      : null,
    createdAt: order.createdAt.toISOString(),
  }));

  return (
    <DashboardOverview
      metrics={metrics}
      stageDistribution={stageDistribution}
      usersMetrics={usersMetrics}
      orders={serializedOrders}
      generatedAt={new Date().toISOString()}
    />
  );
}

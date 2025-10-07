import { DashboardOverview } from "./_components/dashboard-overview";
import { getDeliveriesSnapshot } from "@/lib/deliveries";
import { getInstallationsSnapshot } from "@/lib/installations";
import { getClientsDashboardData } from "@/lib/clients";
import { getOrdersDashboardData } from "@/lib/orders";
import { getUsersMetrics } from "@/lib/users";

export const metadata = {
  title: "Dashboard",
  description: "Centrum dowodzenia operacjami panelu.",
};

export default async function HomePage() {
  const [dashboardData, usersMetrics, installationsSnapshot, deliveriesSnapshot, clientsDashboard] = await Promise.all([
    getOrdersDashboardData(20),
    getUsersMetrics(),
    getInstallationsSnapshot(10),
    getDeliveriesSnapshot(10),
    getClientsDashboardData(12),
  ]);

  const { metrics, stageDistribution, orders } = dashboardData;
  const serializedOrders = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    title: order.title,
    clientName: order.clientName,
    clientCity: order.clientCity,
    partnerName: order.partnerName,
    executionMode: order.executionMode,
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

  const serializedInstallations = {
    metrics: installationsSnapshot.metrics,
    distribution: installationsSnapshot.distribution,
    recent: installationsSnapshot.recent.map((installation) => ({
      id: installation.id,
      installationNumber: installation.installationNumber,
      status: installation.status,
      statusLabel: installation.statusLabel,
      orderId: installation.orderId,
      orderReference: installation.orderReference,
      clientName: installation.clientName,
      city: installation.city,
      scheduledStartAt: installation.scheduledStartAt ? installation.scheduledStartAt.toISOString() : null,
    })),
  };

  const serializedDeliveries = {
    metrics: deliveriesSnapshot.metrics,
    distribution: deliveriesSnapshot.distribution,
    recent: deliveriesSnapshot.recent.map((delivery) => ({
      id: delivery.id,
      deliveryNumber: delivery.deliveryNumber,
      stage: delivery.stage,
      stageLabel: delivery.stageLabel,
      type: delivery.type,
      typeLabel: delivery.typeLabel,
      requiresAdminAttention: delivery.requiresAdminAttention,
      orderId: delivery.orderId,
      clientName: delivery.clientName,
      clientCity: delivery.clientCity,
      scheduledDate: delivery.scheduledDate ? delivery.scheduledDate.toISOString() : null,
      createdAt: delivery.createdAt.toISOString(),
    })),
  };

  const highlightedClients = {
    metrics: clientsDashboard.metrics,
    clients: clientsDashboard.clients.slice(0, 6).map((client) => ({
      id: client.id,
      clientNumber: client.clientNumber,
      fullName: client.fullName,
      city: client.city,
      partnerName: client.partnerName,
      totalOrders: client.totalOrders,
      openOrders: client.openOrders,
      lastOrderAt: client.lastOrderAt ? client.lastOrderAt.toISOString() : null,
      createdAt: client.createdAt.toISOString(),
    })),
  };

  return (
    <DashboardOverview
      metrics={metrics}
      stageDistribution={stageDistribution}
      usersMetrics={usersMetrics}
      orders={serializedOrders}
      installations={serializedInstallations}
      deliveries={serializedDeliveries}
      clients={highlightedClients}
      generatedAt={new Date().toISOString()}
    />
  );
}

import { type ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { requireSession } from "@/lib/auth";

interface AppLayoutProps {
  children: ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const session = await requireSession();

  return <AppShell userName={session.user.name}>{children}</AppShell>;
}

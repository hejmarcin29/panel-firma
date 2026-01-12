import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { InstallerNav } from "./_components/installer-nav";

export const dynamic = "force-dynamic";

export default async function InstallerLayout({ children }: { children: ReactNode }) {
    const session = await getCurrentSession();

    if (!session) {
        redirect("/login");
    }

    const { user } = session;

    // Safety check: if user is strictly an admin and not an installer, maybe they shouldn't be here?
    // Or maybe admins CAN see this view for debugging. Let's allow admins.
    // But if a random user (e.g. architect) tries to access, maybe block?
    // For now, let's just assume if they have 'installer' or 'admin' role.
    const isInstaller = user.roles.includes('installer') || user.roles.includes('admin');
    
    if (!isInstaller) {
         redirect("/dashboard");
    }

    return (
        <div className="min-h-screen bg-zinc-50 font-sans pb-[calc(4rem+env(safe-area-inset-bottom))]">
            <main className="p-4 safe-area-inset-bottom">
                {children}
            </main>

            <InstallerNav />
        </div>
    );
}

import type { ReactNode } from "react";

export default function TodoLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex h-[calc(100dvh-4rem)] md:h-auto overflow-hidden">
            {children}
        </div>
    );
}

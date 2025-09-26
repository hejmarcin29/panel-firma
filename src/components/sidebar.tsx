"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, ClipboardList, Settings, Wrench, UserCircle2, BarChart2, PieChart, LineChart, Globe } from "lucide-react";
import { useSession } from "next-auth/react";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const sections: { title: string; items: NavItem[] }[] = [
  {
    title: "Data",
    items: [
      { href: "/klienci", label: "Klienci", icon: Users },
      { href: "/zlecenia", label: "Zlecenia", icon: ClipboardList },
  { href: "/panel/zlecone-montaze", label: "Montaże — podgląd (admin)", icon: Wrench },
    ],
  },
  {
    title: "Montażysta",
    items: [
      { href: "/panel/montazysta", label: "Panel montażysty", icon: Wrench },
      { href: "/panel/montazysta/prywatne", label: "Prywatne", icon: UserCircle2 },
      { href: "/panel/montazysta/ustawienia", label: "Ustawienia montażysty", icon: Settings },
    ],
  },
  {
    title: "Strony",
    items: [
      { href: "/ustawienia", label: "Ustawienia", icon: Settings },
      { href: "/", label: "Panel główny", icon: Home },
    ],
  },
  {
    title: "Wykresy",
    items: [
      { href: "/raporty/slupki", label: "Słupki", icon: BarChart2 },
      { href: "/raporty/kolowy", label: "Kołowy", icon: PieChart },
      { href: "/raporty/liniowy", label: "Liniowy", icon: LineChart },
      { href: "/raporty/mapa", label: "Mapa", icon: Globe },
    ],
  },
];

export function Sidebar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const role = (session?.user && (session.user as { role?: string }).role) || undefined;
  const isAuthed = status === 'authenticated';
  // Build sections based on role
  const filteredSections = sections
    .map((section) => {
      const items = section.items.filter((item) => {
        // Installer-only items
        if (item.href.startsWith('/panel/montazysta')) {
          return role === 'installer';
        }
        // Admin/manager-only data/reporting pages
        if (
          item.href === '/klienci' ||
          item.href === '/zlecenia' ||
          item.href.startsWith('/panel/zlecone-montaze') ||
          item.href.startsWith('/ustawienia') ||
          item.href.startsWith('/raporty')
        ) {
          return role === 'admin' || role === 'manager' || role === 'architect';
        }
        // Dashboard is for everyone logged-in
        if (item.href === '/') return isAuthed;
        return true;
      });
      return { ...section, items };
    })
    .filter((section) => section.items.length > 0);

  return (
    <aside
      className="fixed left-0 top-0 z-30 h-screen w-64 border-r bg-[var(--pp-panel)] block md:block -translate-x-full data-[open=true]:translate-x-0 md:translate-x-0 transition-transform duration-200 ease-out pointer-events-none data-[open=true]:pointer-events-auto md:pointer-events-auto"
      style={{ borderColor: "var(--pp-border)" }}
    >
      <div className="h-16 px-4 flex items-center justify-between gap-3 border-b" style={{ borderColor: "var(--pp-border)" }}>
        <div className="flex items-center gap-3">
          <UserCircle2 className="h-9 w-9 opacity-80" />
          <div className="leading-tight">
            <div className="font-medium text-sm">{isAuthed ? (session?.user?.email || "Użytkownik") : "Gość"}</div>
            <div className="text-xs opacity-70">{isAuthed ? "Zalogowany" : "Niezalogowany"}</div>
          </div>
        </div>
        <button
          className="md:hidden h-8 w-8 inline-flex items-center justify-center rounded-md border"
          style={{ borderColor: 'var(--pp-border)' }}
          aria-label="Zamknij menu"
          onClick={() => {
            const aside = document.querySelector('aside');
            if (aside) aside.setAttribute('data-open', 'false');
            const overlay = document.getElementById('sidebar-overlay');
            if (overlay) {
              overlay.classList.add('opacity-0');
              overlay.classList.add('pointer-events-none');
            }
            document.body.classList.remove('no-scroll');
          }}
        >
          <span aria-hidden>×</span>
        </button>
      </div>
      <nav className="px-2 py-3 space-y-6 text-sm">
        {filteredSections.map((section) => (
          <div key={section.title}>
            <div className="px-2 text-[11px] uppercase tracking-wider opacity-60 mb-2">{section.title}</div>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                const handleClick = () => {
                  // Auto-close only on small screens
                  if (window.matchMedia && window.matchMedia('(min-width: 768px)').matches) return;
                  const aside = document.querySelector('aside');
                  if (aside) aside.setAttribute('data-open', 'false');
                  const overlay = document.getElementById('sidebar-overlay');
                  if (overlay) {
                    overlay.classList.add('opacity-0');
                    overlay.classList.add('pointer-events-none');
                  }
                  document.body.classList.remove('no-scroll');
                };
                return (
                  <li key={`${section.title}:${item.label}`}>
                    <Link
                      href={item.href}
                      onClick={handleClick}
                      className={[
                        "flex items-center gap-3 rounded-md px-3 py-2",
                        active
                          ? "bg-[var(--pp-primary-subtle-bg)] text-[var(--pp-text)]"
                          : "hover:bg-[var(--pp-primary-subtle-bg)]",
                      ].join(" ")}
                    >
                      <Icon className="h-4 w-4 opacity-80" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

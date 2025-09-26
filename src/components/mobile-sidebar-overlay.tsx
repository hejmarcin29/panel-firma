"use client";

export function MobileSidebarOverlay() {
  const closeSidebar = () => {
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
    <div
      id="sidebar-overlay"
      className="md:hidden fixed inset-0 z-20 bg-black/40 opacity-0 transition-opacity duration-200 pointer-events-none"
      aria-hidden
      onClick={closeSidebar}
    />
  );
}

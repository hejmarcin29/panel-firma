export default function PublicLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <header className="bg-white border-b py-4">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <div className="font-bold text-xl">Prime Podłogi</div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    );
  }

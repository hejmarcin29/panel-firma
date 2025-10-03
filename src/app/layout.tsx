export const metadata = {
  title: 'Panel (basic)',
  description: 'Minimalny start po resecie',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}

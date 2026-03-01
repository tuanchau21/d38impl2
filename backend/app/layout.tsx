/**
 * Minimal layout for Next.js App Router. This app is API-only; the root URL is not used in production (Nginx proxies /api to this app).
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

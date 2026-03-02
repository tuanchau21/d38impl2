import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bulk Shoe Shop",
  description: "B2B bulk shoe catalog",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased">{children}</body>
    </html>
  );
}

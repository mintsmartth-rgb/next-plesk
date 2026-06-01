import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Next.js PostgreSQL Plesk Test",
  description: "A small Next.js app for testing PostgreSQL connectivity on Plesk."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}

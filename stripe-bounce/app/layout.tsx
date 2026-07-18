import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sorcyn — Stripe Connect",
  description: "Sorcyn seller payouts powered by Stripe.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

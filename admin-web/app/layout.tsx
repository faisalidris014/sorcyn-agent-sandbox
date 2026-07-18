import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sorcyn Admin",
  description: "Sorcyn admin console.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: "var(--font-sans)",
              borderRadius: "0.75rem",
            },
          }}
        />
      </body>
    </html>
  );
}

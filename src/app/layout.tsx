import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Autify | Synced Multi-Device Music Player",
  description: "Sync your music across devices accurately and beautifully.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

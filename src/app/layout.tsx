import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ARES - Global Payment, Zero Resistance",
  description: "Solusi pembayaran lintas batas instan untuk freelancer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nyvora Protocol",
  description: "Continuous Asset Streaming & Split-Routing on Stellar",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1a1a2e" />
      </head>
      <body className="bg-zinc-900 text-white">
        {children}
      </body>
    </html>
  );
}

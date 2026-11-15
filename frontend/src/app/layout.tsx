import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ORBIT — Mission Control | NASA Space Apps",
  description:
    "Offline-first Astronaut Health Monitoring System — NASA Space Apps Challenge 2026",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased dark"
    >
      <body className="min-h-full flex flex-col bg-black text-white antialiased selection:bg-cyan-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}

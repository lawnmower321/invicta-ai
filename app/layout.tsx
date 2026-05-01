import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Invicta AI",
  description: "Unconquered. Wholesale real estate intelligence.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full" style={{ colorScheme: "dark" }}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}

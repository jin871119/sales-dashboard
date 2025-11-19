import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sales Dashboard",
  description: "Real-time Sales Data Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}


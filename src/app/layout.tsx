import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crypto Revenue Analysis | Token Revenue Project",
  description:
    "Comprehensive analysis of crypto revenue trends, sentiment, quality, and future leaders",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </body>
    </html>
  );
}

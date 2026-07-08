import type { Metadata } from "next";
import { Gaegu } from "next/font/google";
import "./globals.css";
import { TrackerProvider } from "@/context/TrackerContext";
import { YearWrappedGate } from "@/components/dashboard/YearWrappedGate";

const gaegu = Gaegu({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-gaegu",
});

export const metadata: Metadata = {
  title: "Habit Tracker ♡ Goal · System · Habit",
  description: "귀여운 습관 추적 — 분기 목표 달성을 위한 키치 트래커",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${gaegu.className} ${gaegu.variable}`}>
        <TrackerProvider>
          {children}
          <YearWrappedGate />
        </TrackerProvider>
      </body>
    </html>
  );
}

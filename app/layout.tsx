import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { TrackerProvider } from "@/context/TrackerContext";
import { YearWrappedGate } from "@/components/dashboard/YearWrappedGate";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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
      <body className={nunito.className}>
        <TrackerProvider>
          {children}
          <YearWrappedGate />
        </TrackerProvider>
      </body>
    </html>
  );
}

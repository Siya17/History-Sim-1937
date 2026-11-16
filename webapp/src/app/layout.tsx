import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "1937 Classroom",
  description: "A bilingual classroom game of diplomacy and strategy.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

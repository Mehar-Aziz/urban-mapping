import { Albert_Sans } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";

const albertSans = Albert_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"], 
  variable: "--font-albert-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Urban Mapping",
  description: "Login page for Urban Mapping project",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={albertSans.variable}>
      <body className="${albertSans.variable} font-sans">{children}</body>
    </html>
  );
}

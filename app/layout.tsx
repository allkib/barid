import type { Metadata } from "next";
import { Amiri, Lora } from "next/font/google";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Barid — بريد | Your Daily Letter by SMS",
  description:
    "One personalized SMS each morning — Middle East news from reliable sources and Islamic calendar updates, delivered like a daily letter.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${lora.variable} ${amiri.variable}`}>
      <body>
        <div className="page-bg" aria-hidden="true" />
        <div className="page-pattern" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Setup — Barid",
  description: "Configure your daily Barid SMS letter",
};

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

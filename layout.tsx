import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Small Task — Earn by completing tasks",
  description: "Complete simple online tasks and earn rewards."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

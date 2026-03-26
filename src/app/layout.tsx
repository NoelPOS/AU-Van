import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Provider } from "./Provider";

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "AU Van - Campus Transportation",
  description:
    "Book van transportation for Assumption University students and staff. Quick, reliable rides to Siam Paragon and Mega Bangna.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={dmSans.className}>
      <body className="min-h-screen">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}

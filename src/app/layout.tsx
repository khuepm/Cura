import type { Metadata } from "next";
import { Inter, Noto_Sans } from "next/font/google"; // Import fonts
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans",
});

export const metadata: Metadata = {
  title: "Image Manager",
  description: "Advanced Image Management Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        {/* Material Symbols */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.variable} ${notoSans.variable} font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-white h-screen overflow-hidden flex flex-col`}
      >
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-4 md:p-8 pb-24">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

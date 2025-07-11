import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GrowTrack",
  description: "A private full-stack web app designed to track child's academic progress, exam schedules, and subject performance across multiple school terms and years",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <link rel="icon" href="/favicon.ico" sizes="any" /> 
      <body className={`${fredoka.variable} antialiased`}>
        <Sidebar />
        <div className="ml-0 lg:ml-64">
          {children}
        </div>
      </body>
    </html>
  );
}

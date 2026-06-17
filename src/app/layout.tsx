import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Design Probe Admin",
  description: "Admin panel for Design Probe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-black text-zinc-100">
        <Sidebar />
        <div className="flex-1 ml-[220px] flex flex-col min-h-screen">
          <main className="flex-1 p-6 overflow-auto">{children}</main>
          <footer className="px-6 py-4 border-t border-zinc-800/60 text-center">
            <p className="text-[11px] text-zinc-600">
              Design Probe v2.1
              
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}

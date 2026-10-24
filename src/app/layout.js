import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "CampusEcho — IIUC Kumira Campus Issue Reporter",
  description:
    "AI-powered campus issue reporting and discovery for IIUC Kumira campus. Report problems in English, বাংলা, or Banglish. Powered by open-weight AI (Ollama / Gemma).",
  keywords: ["IIUC", "campus", "issue reporting", "Kumira", "AI", "Ollama"],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-900 text-slate-200">
        {children}
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

export const metadata: Metadata = {
  title: "SUDOCIDIO - Jogo de Deducao e Misterio",
  description:
    "Um jogo multiplayer de deducao logica e quebra-cabeca espacial. Mistura Sudoku com investigacao criminal.",
  keywords: ["jogo", "sudoku", "misterio", "deducao", "multiplayer", "puzzle"],
  authors: [{ name: "Julia & Sofia" }],
};

export const viewport: Viewport = {
  themeColor: "#2d1b0e",
  width: "device-width",
  initialScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning> 
      <body className={`${pixelFont.variable} font-pixel antialiased`}>
        {children}
      </body>
    </html>
  );
}

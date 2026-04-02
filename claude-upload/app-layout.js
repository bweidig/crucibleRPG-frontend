import {
  Cinzel,
  Alegreya,
  Alegreya_Sans,
  JetBrains_Mono,
} from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { NoiseFilter } from "@/components/CardNoise";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "600", "700", "900"],
  display: "swap",
});

const alegreya = Alegreya({
  subsets: ["latin"],
  variable: "--font-alegreya",
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const alegreyaSans = Alegreya_Sans({
  subsets: ["latin"],
  variable: "--font-alegreya-sans",
  weight: ["300", "400", "500", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const lexieReadable = localFont({
  src: [
    {
      path: "../public/fonts/LexieReadable-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/LexieReadable-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-lexie",
  display: "swap",
});

export const metadata = {
  title: "CrucibleRPG",
  description:
    "A tabletop RPG powered by AI. Real mechanics. Real consequences. No group required.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${cinzel.variable} ${alegreya.variable} ${alegreyaSans.variable} ${jetbrainsMono.variable} ${lexieReadable.variable}`}
      >
        <NoiseFilter />
        {children}
      </body>
    </html>
  );
}

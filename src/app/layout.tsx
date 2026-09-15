import type { Metadata, Viewport } from "next";
import { Vazirmatn, Amiri_Quran } from "next/font/google";
import "./globals.css";
import { SWRegister } from "@/components/SWRegister";
import { Shell } from "@/components/Shell";

const vazir = Vazirmatn({ subsets: ["arabic", "latin"], variable: "--font-vazir", display: "swap" });
const quran = Amiri_Quran({ weight: "400", subsets: ["arabic"], variable: "--font-quran", display: "swap" });

export const metadata: Metadata = {
  title: "قرآن صوت — قرائت و شنیدن قرآن",
  description: "قرآن آنلاین با ترجمه فارسی، تفسیر، تلاوت با صدای قاریان، جستجو، نشان‌ها و حالت آفلاین",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0e7a5f",
  width: "device-width",
  initialScale: 1,
};

const themeInit = `(function(){try{var s=JSON.parse(localStorage.getItem('quran-audio')||'{}').state;if(s&&s.settings){var t=s.settings.theme;if(t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark');}else if(matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fa"
      dir="rtl"
      suppressHydrationWarning
      className={`${vazir.variable} ${quran.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-full">
        <SWRegister />
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}

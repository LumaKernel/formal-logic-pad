import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import "katex/dist/katex.min.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

interface Props {
  readonly children: React.ReactNode;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function RootLayout({ children }: Props) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Inline script to set data-theme before first paint, preventing FOUC.
            Must be synchronous and in <head> to run before body renders.
            The theme-mode key and data-theme attribute must match themeLogic.ts constants. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem("theme-mode");var d=document.documentElement;if(m==="light"||m==="dark"){d.setAttribute("data-theme",m)}else{d.setAttribute("data-theme",matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light")}}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable satisfies string} ${geistMono.variable satisfies string}`}
      >
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Familjen_Grotesk, Hind_Siliguri, Noto_Serif_Bengali } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { hasLocale, locales, localePath } from "@/lib/i18n";
import { site } from "@/lib/site";
import "../globals.css";

/**
 * Root layout.
 *
 * It lives under `[lang]` rather than at the top of `app/` because the language
 * has to reach the <html lang> attribute: screen readers pick their voice from
 * it and search engines their index. `proxy.ts` makes sure no request ever
 * arrives here without a locale prefix.
 */

/**
 * Fonts are self-hosted by next/font: no request ever leaves for a font CDN.
 * That is both an LCP win and what makes the strict CSP in next.config.ts
 * possible.
 */
const display = Familjen_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Bengali faces are large. `subsets: ["bengali"]` emits its own @font-face with
 * a Bengali unicode-range, so a reader who never hits a Bengali glyph never
 * downloads it.
 */
const bengali = Hind_Siliguri({
  variable: "--font-bengali",
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const serifBengali = Noto_Serif_Bengali({
  variable: "--font-serif-bengali",
  subsets: ["bengali", "latin"],
  display: "swap",
});

/** Both languages are prerendered at build time; neither is a runtime render. */
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(
  props: LayoutProps<"/[lang]">,
): Promise<Metadata> {
  const { lang } = await props.params;
  if (!hasLocale(lang)) return {};

  const tagline = lang === "bn" ? site.taglineBn : site.tagline;
  const description = lang === "bn" ? site.descriptionBn : site.description;

  return {
    metadataBase: new URL(site.url),
    title: {
      default: `${site.name} · ${tagline}`,
      template: `%s · ${site.name}`,
    },
    description,
    applicationName: site.name,
    keywords:
      lang === "bn"
        ? [
            "ডিজিটাল গ্রন্থাগার",
            "বাংলা বই",
            "বিনামূল্যে বই",
            "অনলাইনে পড়ুন",
            "পিডিএফ ডাউনলোড",
            "উন্মুক্ত গ্রন্থাগার",
          ]
        : [
            "digital library",
            "free books",
            "Bengali books",
            "বাংলা বই",
            "read online",
            "download pdf",
            "public library",
          ],
    authors: [{ name: site.name }],
    openGraph: {
      type: "website",
      siteName: site.name,
      title: `${site.name} · ${tagline}`,
      description,
      url: `${site.url}${localePath(lang)}`,
      locale: lang === "bn" ? "bn_BD" : "en_US",
      alternateLocale: lang === "bn" ? ["en_US"] : ["bn_BD"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${site.name} · ${tagline}`,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    // hreflang: each language points at the other, and x-default at English.
    alternates: {
      canonical: localePath(lang),
      languages: {
        en: localePath("en"),
        bn: localePath("bn"),
        "x-default": localePath("en"),
      },
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e9e5e1" },
    { media: "(prefers-color-scheme: dark)", color: "#14120f" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout(props: LayoutProps<"/[lang]">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();

  return (
    <html lang={lang} suppressHydrationWarning>
      <body
        className={`${display.variable} ${bengali.variable} ${serifBengali.variable} antialiased`}
      >
        <ThemeProvider>{props.children}</ThemeProvider>
      </body>
    </html>
  );
}

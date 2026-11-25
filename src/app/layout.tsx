import type { Metadata, Viewport } from "next";
import "@fontsource/barlow/400.css";
import "@fontsource/barlow/500.css";
import "@fontsource/barlow/600.css";
import "@fontsource/barlow-condensed/500.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wohnungssuche Koblenz",
  description: "Tägliche Suche nach Wohnungen und Häusern in Koblenz und Umgebung – mit Bewertung und Lernfunktion.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#eceeeb",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

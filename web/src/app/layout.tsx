import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import { THEME_SCRIPT } from "@/components/theme-toggle";
import "./globals.css";

/*
 * Bricolage carries the venue name and the big numbers — it has enough
 * character to read as signage rather than as a dashboard. Instrument Sans
 * does the work: labels, tables, forms.
 */
const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const body = Instrument_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Karaoke OS",
  description: "Find the song, tell the DJ.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
      // The script below stamps data-theme before React hydrates, so the
      // server's HTML and the browser's disagree by design on this one
      // attribute.
      suppressHydrationWarning
    >
      <head>
        {/*
          Blocking on purpose, and before anything paints: a stored dark
          choice must apply to the first frame, or the visitor gets a white
          flash on every navigation.
        */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}

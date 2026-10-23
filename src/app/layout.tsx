import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

// One family, two voices: condensed and heavy for form headers, normal width for reading.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

export const metadata: Metadata = {
  title: "NextStep — From confusing documents to clear next steps",
  description:
    "Paste or upload a job posting, application notice, course requirements, or form instructions. NextStep turns it into a checklist in which every item is backed by a quote from the document, and anything unclear is flagged rather than guessed.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}

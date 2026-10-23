import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your checklist — NextStep",
  // Every results page is someone's personal checklist: keep it out of search engines.
  robots: { index: false, follow: false },
};

export default function ResultsLayout({ children }: LayoutProps<"/results">) {
  return children;
}

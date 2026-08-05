import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "MailFox — pequenas surpresas digitais",
  description: "Crie uma caixinha digital com recados, músicas, memórias e pequenas surpresas para seus amigos.",
  openGraph: {
    title: "MailFox",
    description: "Pequenas surpresas, entregues com carinho.",
    type: "website",
    locale: "pt_BR",
    images: [{ url: `${siteUrl}/og.png`, width: 1200, height: 630, alt: "MailFox — pequenas surpresas, entregues com carinho" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MailFox",
    description: "Pequenas surpresas, entregues com carinho.",
    images: [`${siteUrl}/og.png`],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}

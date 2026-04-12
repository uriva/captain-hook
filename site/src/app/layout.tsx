import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const sans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Captain Hook — Webhook translator you can trust",
  description:
    "Transform webhooks with safescript. Know exactly where your data flows before it runs. Open source.",
  openGraph: {
    title: "Captain Hook",
    description:
      "Webhook translator powered by safescript. Static analysis proves where your data goes.",
    url: "https://captainhook.dev",
    siteName: "Captain Hook",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Captain Hook",
    description:
      "Webhook translator powered by safescript. Know exactly where your data flows.",
  },
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <html
    lang="en"
    className={`${sans.variable} ${mono.variable} h-full antialiased`}
    suppressHydrationWarning
  >
    <body className="min-h-full flex flex-col">
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </body>
  </html>
);

export { RootLayout as default };

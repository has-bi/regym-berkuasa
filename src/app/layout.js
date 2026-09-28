import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Layout from "@/components/layout/Layout";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], display: "swap" });

export const metadata = {
  title: "Latihan",
  description: "Personal fitness & body tracker",
  manifest: "/manifest.webmanifest",
  applicationName: "Latihan",
  appleWebApp: {
    capable: true,
    title: "Latihan",
    // The header is light, so dark status-bar text keeps it legible.
    statusBarStyle: "default",
  },
  formatDetection: {
    // Stops iOS turning rep counts and weights into tappable phone links.
    telephone: false,
    date: false,
  },
  other: {
    // Next emits the modern `mobile-web-app-capable`. iOS before 15.4 reads
    // only the prefixed name, so both are declared.
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  // Pinch-zoom stays enabled (WCAG 1.4.4). iOS only auto-zooms on focus when an
  // input is under 16px, so `.field` sets 16px instead of locking the scale.
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={jakarta.className}>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}

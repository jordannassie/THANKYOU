import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thank You. — See it. Believe it. Receive it.",
  description: "Create your vision. Write it down. Give thanks. Keep believing. Watch what God does.",
  keywords: ["vision board", "faith", "gratitude", "prayer", "personal development"],
  openGraph: {
    title: "Thank You.",
    description: "See the future you are believing God for.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

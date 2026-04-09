import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "MCTunnel — Minecraft Server Gateway",
  description: "Expose your Minecraft server to the internet through our secure VPS tunnel.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster 
            position="top-center"
            toastOptions={{
              className: 'bg-white dark:bg-[#111318] text-gray-900 dark:text-[#e8ecf4] border border-gray-200 dark:border-[#1e2330]',
              style: { borderRadius: '12px', padding: '16px', fontWeight: 'bold' }
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}

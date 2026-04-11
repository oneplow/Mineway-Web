import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "react-hot-toast";
import UserProvider from "@/components/UserProvider";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Mineway — Minecraft Server Gateway",
  description: "Expose your Minecraft server to the internet through our secure VPS tunnel.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playpen+Sans+Thai:wght@500;600;700;800&family=Sarabun:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <UserProvider>
            <Navbar />
            {children}
          </UserProvider>
          <Toaster 
            position="top-center"
            toastOptions={{
              className: 'bg-white/80 dark:bg-[#0a0c10]/90 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/5 text-gray-900 dark:text-white',
              style: { borderRadius: '16px', padding: '16px', fontWeight: 'bold' }
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}


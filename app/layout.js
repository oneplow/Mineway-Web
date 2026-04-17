import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "react-hot-toast";
import UserProvider from "@/components/UserProvider";
import SettingsProvider from "@/components/SettingsProvider";
import MaintenanceBanner from "@/components/MaintenanceBanner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const themeInitScript = `
  (function() {
    try {
      var storageKey = "theme";
      var storedTheme = localStorage.getItem(storageKey) || "system";
      var resolvedTheme = storedTheme === "system"
        ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : storedTheme;
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(resolvedTheme);
    } catch (error) {}
  })();
`;

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
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0] dark:from-[#050505] dark:to-[#0a0c10] text-gray-900 dark:text-gray-100 transition-colors duration-300 antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SettingsProvider>
            <MaintenanceBanner />
            <UserProvider>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-1 flex flex-col">
                  {children}
                </main>
                <Footer />
              </div>
            </UserProvider>
            <Toaster
              position="top-center"
              toastOptions={{
                className: 'bg-white/80 dark:bg-[#0a0c10]/90 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/5 text-gray-900 dark:text-white',
                style: { borderRadius: '16px', padding: '16px', fontWeight: 'bold' }
              }}
            />
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { useSettings } from "@/components/SettingsProvider";

export default function Footer() {
  const pathname = usePathname();
  const settings = useSettings();

  // Hide footer on admin, auth, and landing pages (landing page has its own footer)
  const hideOn = ["/admin", "/auth", "/"];
  if (hideOn.some(p => p === "/" ? pathname === "/" : pathname.startsWith(p))) return null;

  return (
    <footer className="mt-auto border-t border-gray-200 dark:border-[#1e2330] bg-white/50 dark:bg-[#0a0c10]/50 backdrop-blur-sm">
      <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs text-gray-500 dark:text-[#4a5568]">
          {settings.footerText ? `\u00a9 ${settings.footerText}` : `\u00a9 ${new Date().getFullYear()} ${settings.siteName}. All rights reserved.`}
        </p>
        
        <div className="flex items-center gap-6">
          {settings.discordUrl && (
            <a href={settings.discordUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-[#5865F2] transition-colors font-medium">
              Discord
            </a>
          )}
          {settings.contactEmail && (
            <a href={`mailto:${settings.contactEmail}`} className="text-xs text-gray-500 hover:text-[#10d97e] transition-colors font-medium">
              Contact Support
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}

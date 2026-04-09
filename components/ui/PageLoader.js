"use client";
import React, { useEffect, useState } from "react";

export default function PageLoader() {
  const [show, setShow] = useState(false);
  
  // Anti-flicker: Only show loader if loading takes more than 200ms
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 200);
    return () => clearTimeout(t);
  }, []);

  if (!show) return <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0c0f]" />;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0c0f] flex flex-col items-center justify-center animate-fade-in relative z-50">
      <div className="relative w-16 h-16 flex items-center justify-center mb-4">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-[#10d97e]/20"></div>
        {/* Inner Spinning Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#10d97e] animate-spin"></div>
        {/* Core Dot */}
        <div className="w-2 h-2 bg-[#10d97e] rounded-full animate-pulse shadow-[0_0_10px_#10d97e]"></div>
      </div>
      <p className="text-gray-500 dark:text-[#8892a4] font-syne font-bold tracking-wider text-sm animate-pulse">
        LOADING DATA
      </p>
    </div>
  );
}

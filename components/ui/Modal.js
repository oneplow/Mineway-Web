"use client";
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function Modal({ isOpen, onClose, title, children, confirmText, onConfirm, cancelText, isDestructive, isProcessing }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Handle mount/unmount timing
  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      document.body.style.overflow = "hidden";
    } else {
      setIsVisible(false);
      document.body.style.overflow = "unset";
      const timer = setTimeout(() => setIsMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Trigger enter animation AFTER browser has painted the initial (hidden) frame
  useEffect(() => {
    if (isMounted && isOpen) {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isMounted, isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { document.body.style.overflow = "unset"; };
  }, []);

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={!isProcessing ? onClose : undefined}
      ></div>
      
      {/* Modal Dialog */}
      <div className={`relative bg-white dark:bg-[#111318] w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-[#1e2330] transition-all duration-300 ease-out ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#1e2330]">
          <h2 className="text-lg font-bold text-gray-900 dark:text-[#e8ecf4]">{title}</h2>
          <button 
            onClick={!isProcessing ? onClose : undefined}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-[#e8ecf4] transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="px-6 py-6 text-[15px] text-gray-600 dark:text-[#8892a4]">
          {children}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-[#0a0c0f]/50 border-t border-gray-100 dark:border-[#1e2330] flex justify-end gap-3 rounded-b-2xl">
          <button 
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-xl font-semibold text-sm text-gray-600 dark:text-[#8892a4] hover:bg-gray-200 dark:hover:bg-[#1e2330] transition-colors disabled:opacity-50"
          >
            {cancelText || "ยกเลิก"}
          </button>
          <button 
            onClick={onConfirm}
            disabled={isProcessing}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm text-white flex items-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed ${
              isDestructive 
                ? "bg-red-500 hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.2)]" 
                : "bg-[#10d97e] hover:brightness-110 shadow-[0_0_15px_rgba(16,217,126,0.2)] text-black dark:text-[#0a0c0f]"
            }`}
          >
            {isProcessing && <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
            {confirmText || "ยืนยัน"}
          </button>
        </div>

      </div>
    </div>
  );
}


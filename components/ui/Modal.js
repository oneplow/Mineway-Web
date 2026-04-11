"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function Modal({ isOpen, onClose, title, subtitle, children, confirmText, onConfirm, cancelText, isDestructive, isProcessing }) {
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

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-[#050505]/40 dark:bg-[#050505]/80 backdrop-blur-md transition-opacity duration-300 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={!isProcessing ? onClose : undefined}
      ></div>
      
      {/* Modal Dialog */}
      <div className={`relative bg-white dark:bg-[#0d1017] w-full max-w-md rounded-[28px] shadow-[0_30px_100px_rgba(0,0,0,0.2)] dark:shadow-[0_30px_100px_rgba(0,0,0,0.8)] border border-gray-200 dark:border-gray-800 transition-all duration-300 ease-out overflow-hidden ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'}`}>
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">{title}</h3>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
          <button 
            onClick={!isProcessing ? onClose : undefined}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-[#e8ecf4] transition-colors p-1 bg-white dark:bg-black/20 rounded-full shrink-0 ml-4"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-8 text-[15px] text-gray-600 dark:text-[#8892a4]">
          {children}
        </div>
        
        {/* Footer */}
        <div className="px-8 py-5 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-800 flex gap-4">
          <button 
            onClick={onClose}
            disabled={isProcessing}
            className="px-6 py-3.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {cancelText || "ยกเลิก"}
          </button>
          <button 
            onClick={onConfirm}
            disabled={isProcessing}
            className={`flex-1 flex justify-center items-center gap-2 py-3.5 rounded-xl font-extrabold text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed ${
              isDestructive 
                ? "bg-gradient-to-r from-rose-500 to-red-600 hover:brightness-110 shadow-[0_0_20px_rgba(244,63,94,0.3)] dark:shadow-[0_0_20px_rgba(244,63,94,0.2)]" 
                : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 shadow-[0_0_20px_rgba(16,217,126,0.5)] dark:shadow-[0_0_20px_rgba(16,217,126,0.2)]"
            }`}
          >
            {isProcessing && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {confirmText || "ยืนยัน"}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}


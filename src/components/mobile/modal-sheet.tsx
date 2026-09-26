"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAppStore } from "@/store/use-app-store";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  fullScreen?: boolean;
}

export function ModalSheet({ open, onClose, title, subtitle, children, footer, fullScreen }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className={`relative w-full ${fullScreen ? "max-w-[480px] h-[92vh]" : "max-w-[480px] max-h-[88vh]"} bg-[#F5F4EE] dark:bg-background rounded-t-3xl shadow-2xl flex flex-col overflow-hidden pb-safe`}
          >
            {/* Drag handle */}
            <div className="pt-2.5 flex justify-center shrink-0">
              <div className="w-10 h-1.5 rounded-full bg-border" />
            </div>
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-border shrink-0">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-foreground truncate">{title}</h2>
                {subtitle && <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-muted active:scale-90 transition shrink-0"
                aria-label="বন্ধ করুন"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            {/* Body */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">{children}</div>
            {/* Footer */}
            {footer && <div className="border-t border-border bg-white dark:bg-card p-3 shrink-0">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

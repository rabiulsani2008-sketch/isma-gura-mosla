"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ShoppingCart, PackagePlus, Wallet, ArrowDownToLine, ArrowUpFromLine, X } from "lucide-react";
import { useAppStore } from "@/store/use-app-store";

export function QuickActionFab() {
  const { activeTab, openModal } = useAppStore();
  const [open, setOpen] = useState(false);

  // Show FAB on home + transactions tabs (stock has its own add-product FAB)
  if (!["home", "transactions"].includes(activeTab)) return null;

  const actions = [
    { label: "বিক্রি করুন", icon: ShoppingCart, color: "#1B5E20", modal: "sale" as const },
    { label: "পণ্য কিনুন", icon: PackagePlus, color: "#1976D2", modal: "purchase" as const },
    { label: "খরচ যোগ", icon: Wallet, color: "#F57C00", modal: "expense" as const },
    { label: "টাকা নিন", icon: ArrowDownToLine, color: "#43A047", modal: "receive_payment" as const },
    { label: "টাকা দিন", icon: ArrowUpFromLine, color: "#8E24AA", modal: "pay_payment" as const },
  ];

  return (
    <div className="fixed bottom-[72px] left-1/2 -translate-x-1/2 z-30" style={{ maxWidth: "480px", width: "100%" }}>
      <div className="relative flex justify-end pr-4">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-16 right-4 flex flex-col gap-2"
            >
              {actions.map((a, i) => (
                <motion.button
                  key={a.modal}
                  initial={{ opacity: 0, x: 20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.8 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => {
                    openModal(a.modal);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 bg-white dark:bg-card shadow-lg rounded-full pl-2 pr-4 py-2 border border-border active:scale-95 transition"
                >
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                    style={{ background: a.color }}
                  >
                    <a.icon className="w-4 h-4" />
                  </span>
                  <span className="text-sm font-medium text-foreground whitespace-nowrap">{a.label}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setOpen((v) => !v)}
          className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-90 transition"
          aria-label="কুইক অ্যাকশন"
        >
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                <X className="w-6 h-6" />
              </motion.span>
            ) : (
              <motion.span key="plus" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                <Plus className="w-6 h-6" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );
}

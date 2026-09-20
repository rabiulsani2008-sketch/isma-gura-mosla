"use client";

import { useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { COMPANY_NAME, COMPANY_TAGLINE } from "@/lib/constants";

export function SplashScreen() {
  return (
    <div className="mobile-shell relative overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-[#0E3D13] via-[#1B5E20] to-[#2E7D32]">
      {/* Spice-themed decorative circles (CSS only, no external images) */}
      <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-[#43A047]/20 blur-2xl" />
      <div className="absolute top-20 -right-16 w-48 h-48 rounded-full bg-[#66BB6A]/15 blur-3xl" />
      <div className="absolute -bottom-12 left-10 w-44 h-44 rounded-full bg-[#2E7D32]/30 blur-2xl" />
      {/* Spice emojis floating */}
      <div className="absolute top-10 left-8 text-2xl opacity-20 rotate-12">🌶️</div>
      <div className="absolute top-16 right-10 text-xl opacity-20 -rotate-12">🌿</div>
      <div className="absolute bottom-32 left-12 text-xl opacity-20 rotate-45">🫘</div>
      <div className="absolute bottom-40 right-8 text-2xl opacity-20 -rotate-6">🌾</div>

      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="w-28 h-28 rounded-3xl bg-white/95 shadow-2xl flex items-center justify-center p-4 animate-pulse-ring">
          <Image src="/logo.png" alt="লোগো" width={88} height={88} className="object-contain" />
        </div>

        <motion.h1
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="mt-6 text-center text-white text-2xl font-bold leading-snug px-6"
        >
          ইসমা গুড়া মসলা
          <br />
          প্রাইভেট লিমিটেড
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="mt-3 text-white/85 text-sm tracking-wide"
        >
          {COMPANY_TAGLINE}
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="absolute bottom-16 flex flex-col items-center gap-3"
      >
        <div className="w-7 h-7 rounded-full border-[3px] border-white/30 border-t-white animate-spin-slow" />
        <p className="text-white/70 text-xs">লোড হচ্ছে...</p>
      </motion.div>

      <div className="absolute bottom-6 text-white/50 text-[10px]">
        v1.0.0 • © {new Date().getFullYear()} {COMPANY_NAME}
      </div>
    </div>
  );
}

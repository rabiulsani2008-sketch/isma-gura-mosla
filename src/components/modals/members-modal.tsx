"use client";

import { useQuery } from "@tanstack/react-query";
import { Copy, Share2, KeyRound, Users } from "lucide-react";
import { ModalSheet } from "@/components/mobile/modal-sheet";
import { useT } from "@/lib/use-i18n";
import { toast } from "sonner";

/**
 * SIMPLE: Just shows the shop code so the owner can share it.
 * Everyone uses the same code to login — no member management needed.
 */
export function MembersModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const { data, isLoading } = useQuery({
    queryKey: ["shop"],
    queryFn: () => fetch("/api/shop").then((r) => r.json()),
    enabled: open,
  });

  const copyCode = () => {
    if (data?.shop?.shopCode) {
      navigator.clipboard.writeText(data.shop.shopCode);
      toast.success("কপি হয়েছে!");
    }
  };

  const shareCode = async () => {
    if (data?.shop?.shopCode) {
      const text = `আমাদের দোকানের শপ কোড: ${data.shop.shopCode}\nএই কোড দিয়ে ইসমা গুড়া মসলা অ্যাপে লগইন করুন।`;
      try {
        if (navigator.share) {
          await navigator.share({ title: "শপ কোড", text });
        } else {
          navigator.clipboard.writeText(text);
          toast.success("কপি হয়েছে!");
        }
      } catch {}
    }
  };

  return (
    <ModalSheet open={open} onClose={onClose} title="শপ কোড শেয়ার" subtitle="সবাই এই কোড দিয়ে লগইন করবে">
      <div className="p-4 space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-[#E3F2FD] flex items-center justify-center">
            <KeyRound className="w-8 h-8 text-[#1565C0]" />
          </div>
        </div>

        {/* Shop code display */}
        {isLoading ? (
          <div className="text-center py-8 text-sm text-muted-foreground">লোড হচ্ছে...</div>
        ) : data?.shop?.shopCode ? (
          <div className="bg-gradient-to-br from-[#1B5E20] to-[#2E7D32] text-white rounded-2xl p-5 text-center">
            <p className="text-xs text-white/80 mb-2">আপনার শপ কোড</p>
            <p className="text-2xl font-bold tracking-wider font-mono mb-3">{data.shop.shopCode}</p>
            <div className="flex gap-2">
              <button
                onClick={copyCode}
                className="flex-1 bg-white/15 hover:bg-white/25 active:scale-95 transition py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Copy className="w-4 h-4" /> কপি
              </button>
              <button
                onClick={shareCode}
                className="flex-1 bg-white/15 hover:bg-white/25 active:scale-95 transition py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Share2 className="w-4 h-4" /> শেয়ার
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">কোড পাওয়া যায়নি</div>
        )}

        {/* How it works */}
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border/50 space-y-3">
          <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
            <Users className="w-4 h-4" /> কিভাবে কাজ করে
          </p>
          <div className="space-y-2 text-xs text-foreground">
            <div className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">১</span>
              <span>এই কোডটি আপনার সব কর্মচারী/পরিবারের সাথে শেয়ার করুন</span>
            </div>
            <div className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">২</span>
              <span>তারা অ্যাপ খুলে এই কোড দিয়ে লগইন করবে</span>
            </div>
            <div className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">৩</span>
              <span>সবাই একই দোকানের ডেটা দেখবে — বিক্রি, স্টক, রিপোর্ট সব</span>
            </div>
            <div className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">৪</span>
              <span>যেকোনো ডিভাইসে কাজ করবে — ফোন, ট্যাবলেট, কম্পিউটার</span>
            </div>
          </div>
        </div>

        <div className="bg-[#E8F5E9] dark:bg-[#1B3A22] rounded-xl p-3 text-center">
          <p className="text-[11px] text-[#1B5E20] dark:text-[#A5D6A7]">
            একই কোড দিয়ে সবাই লগইন করতে পারে। কোনো ফোন নম্বর বা পাসওয়ার্ড লাগে না।
          </p>
        </div>
      </div>
    </ModalSheet>
  );
}

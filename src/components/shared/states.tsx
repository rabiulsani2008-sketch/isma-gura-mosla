"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export function LoadingState({ text = "লোড হচ্ছে..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 className="w-7 h-7 text-primary animate-spin" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-14 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-[260px]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}

/**
 * ErrorState — auto-retries after 3 seconds so users never get stuck.
 * Shows a friendly message + auto-retry countdown + manual retry button.
 */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const [retrying, setRetrying] = useState(false);

  // Auto-retry after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onRetry) {
        setRetrying(true);
        onRetry();
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [onRetry]);

  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-3">
        {retrying ? (
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
        ) : (
          <span className="text-2xl">⏳</span>
        )}
      </div>
      <h3 className="font-semibold text-foreground">{retrying ? "আবার চেষ্টা করা হচ্ছে..." : "লোড হচ্ছে"}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-[260px]">
        {retrying ? "একটু অপেক্ষা করুন" : "সার্ভার সাড়া দিচ্ছে, স্বয়ংক্রিয়ভাবে আবার চেষ্টা করা হচ্ছে..."}
      </p>
      {!retrying && onRetry && (
        <button
          onClick={() => {
            setRetrying(true);
            onRetry();
          }}
          className="mt-4 bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium active:scale-95 transition"
        >
          এখন চেষ্টা করুন
        </button>
      )}
    </div>
  );
}

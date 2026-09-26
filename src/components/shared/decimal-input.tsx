"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  className?: string;
  suffix?: string;
  align?: "left" | "center" | "right";
  min?: number;
  max?: number;
}

/**
 * A decimal-friendly numeric input that allows free typing.
 * - Uses inputMode="decimal" so mobile shows a numeric keypad with a decimal point
 * - Accepts both "." and "," as decimal separators
 * - Allows typing "0.", ".5", "0.25" without fighting the parser
 * - Uses local text state so the user can type intermediate states
 * - Only pushes the parsed number to the parent on change
 */
export function DecimalInput({
  value,
  onChange,
  placeholder = "0",
  className,
  suffix,
  align = "center",
  min = 0,
  max,
}: Props) {
  const [text, setText] = useState<string>(value ? String(value) : "");
  const focused = useRef(false);

  // Sync from parent when not focused
  useEffect(() => {
    if (!focused.current) {
      if (value === 0 || value === undefined || value === null) {
        setText("");
      } else {
        setText(String(value));
      }
    }
  }, [value]);

  const sanitize = (s: string): string => {
    let out = s.replace(/,/g, ".").replace(/[^\d.]/g, "");
    const parts = out.split(".");
    if (parts.length > 2) out = parts[0] + "." + parts.slice(1).join("");
    return out;
  };

  const handleChange = (raw: string) => {
    const cleaned = sanitize(raw);
    setText(cleaned);
    if (cleaned === "" || cleaned === ".") {
      onChange(0);
    } else {
      const n = parseFloat(cleaned);
      if (!isNaN(n)) {
        let final = n;
        if (min != null && final < min) final = min;
        if (max != null && final > max) final = max;
        onChange(final);
      }
    }
  };

  const handleBlur = () => {
    focused.current = false;
    // Normalize display on blur
    if (text === "" || text === ".") {
      setText("");
    } else {
      const n = parseFloat(text);
      if (!isNaN(n)) setText(String(n));
    }
  };

  const alignCls = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="decimal"
        pattern="[0-9.]*"
        value={text}
        onFocus={() => (focused.current = true)}
        onBlur={handleBlur}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full px-2 py-1.5 rounded-lg border border-input bg-background text-sm outline-none focus:border-primary",
          alignCls,
          suffix && "pr-8",
          className
        )}
      />
      {suffix && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
}

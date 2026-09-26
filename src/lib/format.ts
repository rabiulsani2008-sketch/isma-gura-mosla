// Bengali digit conversion + currency formatting

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBnDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

export function toEnDigits(input: string): string {
  return input.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
}

/** Format a number with Bangla digits and thousand separators (Bangladeshi style). */
export function formatBnNumber(n: number, decimals = 0): string {
  if (!isFinite(n)) n = 0;
  const fixed = Math.abs(n).toFixed(decimals);
  const [intPart, decPart] = fixed.split(".");
  // Bangladeshi numbering: group by 2 after first 3
  let lastThree = intPart.slice(-3);
  const rest = intPart.slice(0, -3);
  if (rest) {
    lastThree = "," + lastThree;
  }
  const groupedRest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  const grouped = groupedRest + lastThree;
  const result = decPart ? `${grouped}.${decPart}` : grouped;
  return toBnDigits((n < 0 ? "-" : "") + result);
}

/** Currency: ৳ ১২,৫০০ */
export function formatTk(n: number, decimals = 0): string {
  return `৳ ${formatBnNumber(n, decimals)}`;
}

/** Compact currency for tight spaces: ৳ ১২.৫ হাজার */
export function formatTkCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 100000) return `৳ ${toBnDigits((n / 100000).toFixed(2))} লক্ষ`;
  if (abs >= 1000) return `৳ ${toBnDigits((n / 1000).toFixed(1))} হাজার`;
  return formatTk(n);
}

export function formatBnDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const months = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
  ];
  return `${toBnDigits(date.getDate())} ${months[date.getMonth()]}, ${toBnDigits(date.getFullYear())}`;
}

export function formatBnDateShort(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const months = ["জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্ট", "অক্টো", "নভে", "ডিসে"];
  return `${toBnDigits(date.getDate())} ${months[date.getMonth()]}`;
}

export function formatBnTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  let h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${toBnDigits(h)}:${toBnDigits(String(m).padStart(2, "0"))} ${ampm}`;
}

export function formatBnDateTime(d: Date | string): string {
  return `${formatBnDateShort(d)} ${formatBnTime(d)}`;
}

/** Convert an ISO date to yyyy-mm-dd for <input type="date"> */
export function toInputDate(d: Date | string = new Date()): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

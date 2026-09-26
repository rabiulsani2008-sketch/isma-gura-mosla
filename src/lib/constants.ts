// App-wide constants (Bengali)

export const COMPANY_NAME = "ইসমা গুড়া মসলা প্রাইভেট লিমিটেড";
export const COMPANY_TAGLINE = "গুণগত মান, বিশ্বাস আমাদের";
export const CURRENCY = "৳";

export const CATEGORIES = ["মসলা", "গুঁড়া মসলা", "শুকনা মসলা", "অন্যান্য"] as const;
export type Category = (typeof CATEGORIES)[number];

export const UNITS = ["kg", "gram", "piece", "packet", "box", "litre"] as const;
export type Unit = (typeof UNITS)[number];

export const PAYMENT_METHODS = ["নগদ", "বিকাশ", "ব্যাংক", "বাকিতে"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const EXPENSE_CATEGORIES = [
  "দোকান ভাড়া",
  "বিদ্যুৎ",
  "কর্মচারী",
  "পরিবহন",
  "প্যাকেট",
  "মেরামত",
  "অন্যান্য",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const TRANSACTION_TABS = [
  { key: "all", label: "সব" },
  { key: "sale", label: "বিক্রি" },
  { key: "purchase", label: "কেনা" },
  { key: "expense", label: "খরচ" },
  { key: "customer_payment", label: "পাওনা" },
  { key: "supplier_payment", label: "দেনা" },
] as const;

export const REPORT_RANGES = [
  { key: "today", label: "আজ" },
  { key: "week", label: "এই সপ্তাহ" },
  { key: "month", label: "এই মাস" },
  { key: "six_months", label: "৬ মাস" },
  { key: "year", label: "এই বছর" },
  { key: "custom", label: "কাস্টম" },
] as const;

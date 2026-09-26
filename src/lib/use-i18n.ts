"use client";

import { useAppStore } from "@/store/use-app-store";
import { translations, type Lang, type TranslationKey } from "@/lib/i18n";

export function useLang(): Lang {
  return useAppStore((s) => s.language);
}

export function useT() {
  const lang = useAppStore((s) => s.language);
  return (key: TranslationKey): string => {
    return translations[lang][key] ?? translations.bn[key] ?? key;
  };
}

export function t(lang: Lang, key: TranslationKey): string {
  return translations[lang][key] ?? translations.bn[key] ?? key;
}

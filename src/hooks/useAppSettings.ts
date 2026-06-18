import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { defaultSettings, subscribeToSettings } from '@/services/businessService';
import { translations, type TranslationKey } from '@/i18n/translations';
import type { AppSettings } from '@/types/business';
import { formatProductPrice } from '@/types/product';

export const languages = ['en', 'am'] as const;
export type LanguageCode = (typeof languages)[number];

const LANGUAGE_STORAGE_KEY = '@mamuye/settings/language';
const languageListeners = new Set<(language: LanguageCode) => void>();
let cachedLanguage: LanguageCode = 'en';

function normalizeLanguage(language: string | null | undefined): LanguageCode {
  return language === 'am' ? 'am' : 'en';
}

async function loadLanguagePreference() {
  const stored = normalizeLanguage(await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY));
  cachedLanguage = stored;
  languageListeners.forEach((listener) => listener(stored));
  return stored;
}

export async function setLanguagePreference(language: LanguageCode) {
  cachedLanguage = normalizeLanguage(language);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, cachedLanguage);
  languageListeners.forEach((listener) => listener(cachedLanguage));
}

export function useLanguagePreference() {
  const [language, setLanguage] = useState<LanguageCode>(cachedLanguage);

  useEffect(() => {
    languageListeners.add(setLanguage);
    void loadLanguagePreference();

    return () => {
      languageListeners.delete(setLanguage);
    };
  }, []);

  return { language, setLanguage: setLanguagePreference };
}

export function useAppSettings() {
  const { language } = useLanguagePreference();
  const [settings, setSettings] = useState<Omit<AppSettings, 'updatedAt'>>({
    ...defaultSettings,
    language: cachedLanguage,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return subscribeToSettings(
      (next) => {
        setSettings({ ...next, language });
        setError(null);
      },
      (nextError) => setError(nextError.message)
    );
  }, [language]);

  return { error, settings: { ...settings, language } };
}

export function useMoneyFormatter() {
  const { settings } = useAppSettings();

  return useCallback(
    (price: number) => formatProductPrice(price, settings.currency),
    [settings.currency]
  );
}

export function getLanguageLabel(language: string) {
  if (language === 'am') return 'Amharic';
  if (language === 'om') return 'Afaan Oromo';
  return 'English';
}

export function useTranslation() {
  const { settings } = useAppSettings();
  const language = settings.language === 'am' ? 'am' : 'en';

  return (key: TranslationKey) => translations[language][key] ?? translations.en[key];
}

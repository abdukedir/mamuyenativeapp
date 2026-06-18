import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { getLanguageLabel, languages, useLanguagePreference, useTranslation } from '@/hooks/useAppSettings';

export function LanguageSelector() {
  const t = useTranslation();
  const { language, setLanguage } = useLanguagePreference();

  return (
    <View style={styles.wrap}>
      <ThemedText style={styles.label}>{t('language')}</ThemedText>
      <View style={styles.row}>
        {languages.map((item) => (
          <Pressable
            key={item}
            accessibilityRole="button"
            onPress={() => {
              void setLanguage(item);
            }}
            style={[styles.chip, language === item && styles.chipActive]}>
            <ThemedText style={[styles.chipText, language === item && styles.chipTextActive]}>
              {getLanguageLabel(item)}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    color: '#344054',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 38,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#d0d5dd',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    borderColor: '#0878ff',
    backgroundColor: '#eaf2ff',
  },
  chipText: {
    color: '#344054',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
  },
  chipTextActive: {
    color: '#0878ff',
  },
});

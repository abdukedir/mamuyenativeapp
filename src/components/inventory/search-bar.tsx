import { StyleSheet, View } from 'react-native';
import { Search } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';

export function SearchBar({ placeholder }: { placeholder: string }) {
  return (
    <View style={styles.search}>
      <Search color="#758197" size={18} strokeWidth={2.2} />
      <ThemedText style={styles.placeholder}>{placeholder}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    height: 50,
    borderRadius: 10,
    backgroundColor: '#f5f7fb',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    flex: 1,
  },
  placeholder: {
    color: '#9aa3b2',
    fontSize: 14,
    lineHeight: 18,
  },
});

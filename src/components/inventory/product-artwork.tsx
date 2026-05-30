import { StyleSheet, View } from 'react-native';
import { Cable, Refrigerator, Speaker, Tv } from 'lucide-react-native';

import type { CategorySlug } from '@/constants/inventory-data';

const iconByCategory = {
  tv: Tv,
  speakers: Speaker,
  refrigerators: Refrigerator,
  accessories: Cable,
};

export function ProductArtwork({
  category,
  accent,
  size = 'medium',
}: {
  category: CategorySlug;
  accent: string;
  size?: 'small' | 'medium';
}) {
  const dimensions = size === 'small' ? styles.small : styles.medium;
  const Icon = iconByCategory[category];

  return (
    <View style={[styles.art, dimensions, { backgroundColor: `${accent}1A` }]}>
      <View style={[styles.device, { backgroundColor: accent }]}>
        <Icon color="#ffffff" size={size === 'small' ? 24 : 32} strokeWidth={2.2} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  art: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  medium: {
    width: 92,
    height: 72,
  },
  small: {
    width: 74,
    height: 56,
  },
  device: {
    width: '76%',
    height: '68%',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

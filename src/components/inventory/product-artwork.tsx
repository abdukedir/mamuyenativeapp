import { StyleSheet, View } from 'react-native';
import { Package } from 'lucide-react-native';

export function ProductArtwork({
  category,
  accent,
  size = 'medium',
}: {
  category: string;
  accent: string;
  size?: 'small' | 'medium';
}) {
  const dimensions = size === 'small' ? styles.small : styles.medium;

  return (
    <View style={[styles.art, dimensions, { backgroundColor: `${accent}1A` }]}>
      <View style={[styles.device, { backgroundColor: accent }]}>
        <Package color="#ffffff" size={size === 'small' ? 24 : 32} strokeWidth={2.2} />
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

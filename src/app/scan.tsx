import { router } from 'expo-router';
import { Alert } from 'react-native';

import { BarcodeScannerView } from '@/components/inventory/barcode-scanner-view';

export default function ScanScreen() {
  return (
    <BarcodeScannerView
      onCancel={() => router.back()}
      onScanned={(value) => {
        Alert.alert('Code scanned', value, [{ text: 'OK', onPress: () => router.back() }]);
      }}
    />
  );
}

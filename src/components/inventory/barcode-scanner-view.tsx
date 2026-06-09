import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import { ScanLine } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/AuthButton';
import { ThemedText } from '@/components/themed-text';

type BarcodeScannerViewProps = {
  title?: string;
  onCancel: () => void;
  onScanned: (value: string) => void;
};

export function BarcodeScannerView({
  title = 'Scan QR or barcode',
  onCancel,
  onScanned,
}: BarcodeScannerViewProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [ready, setReady] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);
  const [mountError, setMountError] = useState<string | null>(null);
  const requestedRef = useRef(false);

  useEffect(() => {
    if (!permission && !requestedRef.current) {
      requestedRef.current = true;
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const isInsecureWeb =
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    !window.isSecureContext &&
    window.location.hostname !== 'localhost';

  function flipCamera() {
    setReady(false);
    setMountError(null);
    setCameraActive(false);

    setTimeout(() => {
      setFacing((current) => (current === 'back' ? 'front' : 'back'));
      setCameraActive(true);
    }, 180);
  }

  if (isInsecureWeb) {
    return (
      <SafeAreaView style={styles.permissionRoot}>
        <View style={styles.permissionPanel}>
          <ScanLine color="#0878ff" size={38} strokeWidth={2.3} />
          <ThemedText style={styles.permissionTitle}>Camera needs HTTPS</ThemedText>
          <ThemedText style={styles.permissionCopy}>
            Open this app on HTTPS or localhost. Browsers block camera preview on insecure pages.
          </ThemedText>
          <AuthButton title="Cancel" variant="secondary" onPress={onCancel} />
        </View>
      </SafeAreaView>
    );
  }

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.permissionRoot}>
        <View style={styles.permissionPanel}>
          <ScanLine color="#0878ff" size={38} strokeWidth={2.3} />
          <ThemedText style={styles.permissionTitle}>Camera access is required</ThemedText>
          <ThemedText style={styles.permissionCopy}>
            Allow camera permission to scan QR codes and product barcodes.
          </ThemedText>
          <AuthButton title="Allow Camera" onPress={requestPermission} />
          <AuthButton title="Cancel" variant="secondary" onPress={onCancel} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.cameraLayer}>
        {cameraActive ? (
          <CameraView
            key={facing}
            active={cameraActive}
            autofocus="on"
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e'],
            }}
            facing={facing}
            onBarcodeScanned={(result) => {
              if (locked) {
                return;
              }

              setLocked(true);
              onScanned(result.data);
            }}
            onCameraReady={() => {
              setReady(true);
              setMountError(null);
            }}
            onMountError={(event) => setMountError(event.message)}
            style={styles.camera}
          />
        ) : null}
      </View>
      <SafeAreaView pointerEvents="box-none" style={styles.overlay}>
        <View style={styles.topBar}>
          <ThemedText style={styles.title}>{title}</ThemedText>
          <View style={styles.topActions}>
            <Pressable
              accessibilityRole="button"
              onPress={flipCamera}
              style={styles.closeButton}>
              <ThemedText style={styles.closeText}>
                {facing === 'back' ? 'Front' : 'Back'}
              </ThemedText>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onCancel} style={styles.closeButton}>
              <ThemedText style={styles.closeText}>Close</ThemedText>
            </Pressable>
          </View>
        </View>
        {!ready || mountError ? (
          <View style={styles.statusPanel}>
            <ThemedText style={styles.statusText}>
              {mountError ?? 'Starting camera preview...'}
            </ThemedText>
          </View>
        ) : null}
        <View style={styles.frame}>
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />
        </View>
        <ThemedText style={styles.hint}>Place the QR code or barcode inside the frame.</ThemedText>
        <ThemedText style={styles.cameraLabel}>
          {facing === 'back' ? 'Back camera' : 'Front camera'}
        </ThemedText>
      </SafeAreaView>
    </View>
  );
}

const corner = {
  position: 'absolute' as const,
  width: 42,
  height: 42,
  borderColor: '#ffffff',
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flex: 1,
    paddingHorizontal: 22,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  topActions: {
    flexDirection: 'row',
    gap: 8,
  },
  topBar: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
  },
  closeButton: {
    minHeight: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 24, 40, 0.72)',
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  frame: {
    alignSelf: 'center',
    width: '82%',
    maxWidth: 320,
    aspectRatio: 1,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  statusPanel: {
    alignSelf: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(16, 24, 40, 0.72)',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  statusText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  cornerTopLeft: {
    ...corner,
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 18,
  },
  cornerTopRight: {
    ...corner,
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 18,
  },
  cornerBottomLeft: {
    ...corner,
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 18,
  },
  cornerBottomRight: {
    ...corner,
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 18,
  },
  hint: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  cameraLabel: {
    color: 'rgba(255, 255, 255, 0.82)',
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  permissionRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6f8fb',
    padding: 24,
  },
  permissionPanel: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbe7ff',
    backgroundColor: '#ffffff',
    padding: 18,
    gap: 14,
    alignItems: 'center',
  },
  permissionTitle: {
    color: '#101828',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
  },
  permissionCopy: {
    color: '#667085',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
});

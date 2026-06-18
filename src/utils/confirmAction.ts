import { Alert, Platform } from 'react-native';

type ConfirmActionOptions = {
  title: string;
  message: string;
  confirmText?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
};

export function confirmAction({
  title,
  message,
  confirmText = 'Confirm',
  destructive = false,
  onConfirm,
}: ConfirmActionOptions) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const confirmed = window.confirm(`${title}\n\n${message}`);

    if (confirmed) {
      void onConfirm();
    }

    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: confirmText,
      style: destructive ? 'destructive' : 'default',
      onPress: () => {
        void onConfirm();
      },
    },
  ]);
}

import { forwardRef } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';

type AuthInputProps = TextInputProps & {
  label: string;
  error?: string;
};

export const AuthInput = forwardRef<TextInput, AuthInputProps>(
  ({ label, error, style, accessibilityLabel, ...props }, ref) => (
    <View style={styles.wrap}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <TextInput
        ref={ref}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={error}
        autoCapitalize="none"
        placeholderTextColor="#98a2b3"
        style={[styles.input, error && styles.inputError, style]}
        {...props}
      />
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
    </View>
  )
);

AuthInput.displayName = 'AuthInput';

const styles = StyleSheet.create({
  wrap: {
    gap: 7,
  },
  label: {
    color: '#344054',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  input: {
    minHeight: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d0d5dd',
    backgroundColor: '#ffffff',
    color: '#101828',
    fontSize: 16,
    paddingHorizontal: 14,
  },
  inputError: {
    borderColor: '#f04438',
  },
  error: {
    color: '#d92d20',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
});

import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type AuthButtonProps = PressableProps & {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
};

export function AuthButton({ title, loading, disabled, variant = 'primary', style, ...props }: AuthButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={(state) => [
        styles.button,
        variant === 'secondary' && styles.secondary,
        isDisabled && styles.disabled,
        state.pressed && !isDisabled && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#ffffff' : '#0878ff'} />
      ) : (
        <ThemedText style={[styles.text, variant === 'secondary' && styles.secondaryText]}>
          {title}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0878ff',
  },
  secondary: {
    borderWidth: 1,
    borderColor: '#c9ddff',
    backgroundColor: '#f5f9ff',
  },
  disabled: {
    opacity: 0.65,
  },
  pressed: {
    opacity: 0.86,
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  secondaryText: {
    color: '#0878ff',
  },
});

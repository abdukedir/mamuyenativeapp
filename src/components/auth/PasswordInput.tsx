import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View, type TextInputProps } from 'react-native';

import { AuthInput } from './AuthInput';

type PasswordInputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function PasswordInput(props: PasswordInputProps) {
  const [secure, setSecure] = useState(true);
  const Icon = secure ? Eye : EyeOff;

  return (
    <View>
      <AuthInput
        {...props}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={secure}
        textContentType="password"
        style={styles.input}
      />
      <Pressable
        accessibilityLabel={secure ? 'Show password' : 'Hide password'}
        accessibilityRole="button"
        hitSlop={10}
        onPress={() => setSecure((value) => !value)}
        style={styles.toggle}>
        <Icon color="#667085" size={21} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    paddingRight: 48,
  },
  toggle: {
    position: 'absolute',
    right: 14,
    top: 38,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

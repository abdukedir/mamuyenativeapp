import { StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { Search } from 'lucide-react-native';

type SearchBarProps = TextInputProps & {
  containerStyle?: StyleProp<ViewStyle>;
  placeholder: string;
};

export function SearchBar({ containerStyle, placeholder, style, ...props }: SearchBarProps) {
  return (
    <View style={[styles.search, containerStyle]}>
      <Search color="#758197" size={18} strokeWidth={2.2} />
      <TextInput
        accessibilityLabel={placeholder}
        autoCapitalize="none"
        placeholder={placeholder}
        placeholderTextColor="#9aa3b2"
        style={[styles.input, style]}
        {...props}
      />
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
  input: {
    flex: 1,
    color: '#101828',
    fontSize: 14,
    lineHeight: 18,
    paddingVertical: 0,
  },
});

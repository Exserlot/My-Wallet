import { forwardRef, type ComponentRef } from 'react';
import {
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from 'react-native';

export const appFontAssets = {
  NotoSansThaiRegular: require('@expo-google-fonts/noto-sans-thai/400Regular/NotoSansThai_400Regular.ttf'),
  NotoSansThaiMedium: require('@expo-google-fonts/noto-sans-thai/500Medium/NotoSansThai_500Medium.ttf'),
  NotoSansThaiSemiBold: require('@expo-google-fonts/noto-sans-thai/600SemiBold/NotoSansThai_600SemiBold.ttf'),
  NotoSansThaiBold: require('@expo-google-fonts/noto-sans-thai/700Bold/NotoSansThai_700Bold.ttf'),
  NotoSansThaiExtraBold: require('@expo-google-fonts/noto-sans-thai/800ExtraBold/NotoSansThai_800ExtraBold.ttf'),
} as const;

function resolveFontFamily(style: StyleProp<TextStyle>) {
  const flattened = StyleSheet.flatten(style);
  if (flattened?.fontFamily) return flattened.fontFamily;

  const numericWeight = Number(flattened?.fontWeight ?? 400);
  if (numericWeight >= 800) return 'NotoSansThaiExtraBold';
  if (numericWeight >= 700) return 'NotoSansThaiBold';
  if (numericWeight >= 600) return 'NotoSansThaiSemiBold';
  if (numericWeight >= 500) return 'NotoSansThaiMedium';
  return 'NotoSansThaiRegular';
}

export const Text = forwardRef<ComponentRef<typeof NativeText>, TextProps>(function Text({ style, ...props }, ref) {
  return <NativeText ref={ref} {...props} style={[style, { fontFamily: resolveFontFamily(style), fontWeight: 'normal' }]} />;
});

export const TextInput = forwardRef<ComponentRef<typeof NativeTextInput>, TextInputProps>(function TextInput(
  { autoCorrect = false, spellCheck = false, style, ...props },
  ref,
) {
  return (
    <NativeTextInput
      ref={ref}
      autoCorrect={autoCorrect}
      spellCheck={spellCheck}
      {...props}
      style={[style, { fontFamily: resolveFontFamily(style), fontWeight: 'normal' }]}
    />
  );
});

import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: '#F4F5EF' }, headerShadowVisible: false, headerTintColor: '#173F2B' }}>
      <Stack.Screen name="index" options={{ title: 'ตั้งค่า' }} />
    </Stack>
  );
}

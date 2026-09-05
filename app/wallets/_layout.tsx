import { Stack } from 'expo-router';

export default function WalletLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#F4F5EF' },
        headerShadowVisible: false,
        headerTintColor: '#173F2B',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'กระเป๋าของฉัน' }} />
      <Stack.Screen name="new" options={{ title: 'เพิ่มกระเป๋า' }} />
    </Stack>
  );
}


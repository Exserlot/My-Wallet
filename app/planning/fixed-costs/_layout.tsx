import { Stack } from 'expo-router';

export default function FixedCostLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#F4F5EF' },
        headerShadowVisible: false,
        headerTintColor: '#173F2B',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Fixed Cost' }} />
      <Stack.Screen name="new" options={{ title: 'เพิ่ม Fixed Cost' }} />
      <Stack.Screen name="[id]" options={{ title: 'กำหนดจ่าย' }} />
    </Stack>
  );
}

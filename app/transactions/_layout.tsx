import { Stack } from 'expo-router';

export default function TransactionLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#F4F5EF' },
        headerShadowVisible: false,
        headerTintColor: '#173F2B',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'รายการ' }} />
      <Stack.Screen name="new" options={{ title: 'เพิ่มรายการ' }} />
      <Stack.Screen name="[id]" options={{ title: 'จัดหมวดรายจ่าย' }} />
    </Stack>
  );
}

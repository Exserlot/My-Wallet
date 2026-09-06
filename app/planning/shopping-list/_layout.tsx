import { Stack } from 'expo-router';

export default function ShoppingListLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#F4F5EF' },
        headerShadowVisible: false,
        headerTintColor: '#173F2B',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'ของที่ต้องซื้อ' }} />
      <Stack.Screen name="new" options={{ title: 'เพิ่มของที่ต้องซื้อ' }} />
      <Stack.Screen name="checkout" options={{ title: 'ยืนยันการซื้อ' }} />
    </Stack>
  );
}

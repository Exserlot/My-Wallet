import { Stack } from 'expo-router';

export default function CategoryLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#F4F5EF' },
        headerShadowVisible: false,
        headerTintColor: '#173F2B',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'หมวดรายจ่าย' }} />
      <Stack.Screen name="new" options={{ title: 'สร้างหมวด' }} />
    </Stack>
  );
}

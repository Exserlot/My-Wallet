import { Stack } from 'expo-router';

export default function PlanningLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#F4F5EF' },
        headerShadowVisible: false,
        headerTintColor: '#173F2B',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'วางแผน' }} />
      <Stack.Screen name="budget" options={{ title: 'ตั้งงบเดือน' }} />
      <Stack.Screen name="fixed-costs" options={{ headerShown: false }} />
      <Stack.Screen name="shopping-list" options={{ headerShown: false }} />
    </Stack>
  );
}

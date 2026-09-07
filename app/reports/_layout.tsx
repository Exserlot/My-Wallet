import { Stack } from 'expo-router';

export default function ReportsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#F4F5EF' },
        headerShadowVisible: false,
        headerTintColor: '#173F2B',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'รายงานการเงิน' }} />
    </Stack>
  );
}

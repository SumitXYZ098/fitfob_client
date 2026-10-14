import { Stack } from 'expo-router';

export default function GymLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ViewAllScreen" options={{ headerShown: false }} />
      <Stack.Screen name="Mapviewscreen" options={{ headerShown: false }} />
      <Stack.Screen name="gym-detail" options={{ headerShown: false }} />
      <Stack.Screen name="reviews" options={{ headerShown: false }} />
    </Stack>
  );
}

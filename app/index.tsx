import { Redirect } from 'expo-router';

// In a real app, check auth session here and redirect accordingly
// For now: go straight to sign-in for the full UI flow
export default function Index() {
  // Uncomment to skip auth and go straight to the app:
  // return <Redirect href="/(tabs)" />;
  return <Redirect href="/(auth)/sign-in" />;
}

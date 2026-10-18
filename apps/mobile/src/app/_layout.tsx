import { Stack } from 'expo-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider, useAuth } from '../state/auth'
import { queryClient, configurationError } from '../lib/runtime'
import { SetupScreen } from '../ui/setup'
import { Button, Loading, Screen, ErrorMessage } from '../ui/components'
import { theme } from '../ui/theme'
function Navigation() {
  const { ready, notice, retryRestore } = useAuth()
  if (!ready)
    return (
      <Screen title="Brandista">
        <Loading />
        <ErrorMessage error={notice ? new Error(notice) : null} />
        {notice ? <Button title="Retry" onPress={retryRestore} /> : null}
      </Screen>
    )
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.paper },
          headerTintColor: theme.ink,
          contentStyle: { backgroundColor: theme.paper },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="sign-in" options={{ title: 'Customer account' }} />
        <Stack.Screen name="products/[slug]" options={{ title: 'Product' }} />
        <Stack.Screen name="brands/[id]" options={{ title: 'Brand storefront' }} />
        <Stack.Screen name="addresses" options={{ title: 'Delivery addresses' }} />
        <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
        <Stack.Screen name="orders/index" options={{ title: 'Your orders' }} />
        <Stack.Screen name="orders/[id]" options={{ title: 'Order details' }} />
      </Stack>
    </>
  )
}
export default function Layout() {
  return (
    <SafeAreaProvider>
      {configurationError ? (
        <SetupScreen />
      ) : (
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Navigation />
          </AuthProvider>
        </QueryClientProvider>
      )}
    </SafeAreaProvider>
  )
}

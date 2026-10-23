import { Stack, router } from 'expo-router'

import { QueryClientProvider } from '@tanstack/react-query'

import { SafeAreaProvider } from 'react-native-safe-area-context'

import { StatusBar } from 'expo-status-bar'

import { AuthProvider, useAuth } from '../state/auth'

import { queryClient } from '../lib/runtime'

import { Button, Loading, Screen, ErrorMessage } from '../ui/components'

import { theme } from '../ui/theme'

import { ShowcaseProvider, useShowcase } from '../showcase/state'

import { View } from 'react-native'

function Navigation() {
  const { ready, notice, retryRestore } = useAuth()

  const { demo, setDemo } = useShowcase()

  if (!ready && !demo)
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

      {!demo && (
        <View style={{ padding: 8, backgroundColor: theme.paper }}>
          <Button
            title="LIVE SHOPPING · Return to offline showcase"
            onPress={() => {
              setDemo(true)
              router.replace('/showcase')
            }}
          />
        </View>
      )}

      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.paper },

          headerTintColor: theme.ink,

          contentStyle: { backgroundColor: theme.paper },
        }}
      >
        <Stack.Screen name="showcase" options={{ headerShown: false }} />

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
      <ShowcaseProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Navigation />
          </AuthProvider>
        </QueryClientProvider>
      </ShowcaseProvider>
    </SafeAreaProvider>
  )
}

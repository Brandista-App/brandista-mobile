import { Tabs } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../state/auth'
import { api } from '../../lib/runtime'
import { theme } from '../../ui/theme'
export default function TabLayout() {
  const { session } = useAuth()
  const cart = useQuery({
    queryKey: ['cart', session?.account.id],
    queryFn: api.cart,
    enabled: !!session,
  })
  const count = cart.data?.items.reduce((n, item) => n + item.quantity, 0) || 0
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.ink,
        tabBarStyle: { backgroundColor: theme.paper },
        headerStyle: { backgroundColor: theme.paper },
        headerTintColor: theme.ink,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="brands" options={{ title: 'Brands' }} />
      <Tabs.Screen name="catalogue" options={{ title: 'Explore' }} />
      <Tabs.Screen name="cart" options={{ title: 'Cart', tabBarBadge: count || undefined }} />
      <Tabs.Screen name="account" options={{ title: 'Account' }} />
    </Tabs>
  )
}

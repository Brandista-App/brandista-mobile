import { useState } from 'react'
import { Text } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '../../state/auth'
import { Button, ErrorMessage, Gate, Screen, styles } from '../../ui/components'
function Profile() {
  const { session, signOut } = useAuth()
  const [error, setError] = useState<unknown>(null)
  return (
    <Screen title="Your account">
      <Text style={styles.heading}>{session!.account.email}</Text>
      <Text style={styles.muted}>Customer #{session!.account.id}</Text>
      <Button title="Delivery addresses" onPress={() => router.push('/addresses')} />
      <Button title="Order history" onPress={() => router.push('/orders')} />
      <ErrorMessage error={error} />
      <Button title="Sign out" onPress={() => void signOut().catch(setError)} />
    </Screen>
  )
}
export default function Account() {
  return (
    <Gate>
      <Profile />
    </Gate>
  )
}

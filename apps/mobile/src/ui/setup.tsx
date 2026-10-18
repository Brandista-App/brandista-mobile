import { useState } from 'react'
import { Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BrandMark } from './brand'
import { Button, Heading, Screen, styles } from './components'
import { theme } from './theme'

export function SetupScreen() {
  const [help, setHelp] = useState(false)
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.paper }}>
      <Screen title="Welcome to Brandista">
        <BrandMark />
        {help ? (
          <>
            <Heading>Connect your iPhone</Heading>
            <Text style={styles.text}>
              Ask your project owner for the approved HTTPS API address. Set
              EXPO_PUBLIC_API_BASE_URL in .env.local, then restart Expo. The address must end in
              /api/v1.
            </Text>
            <Text style={styles.muted}>
              localhost and 10.0.2.2 do not reach your Windows backend from an iPhone. No account
              credentials belong in this setting.
            </Text>
            <Button title="Back to welcome" onPress={() => setHelp(false)} />
          </>
        ) : (
          <>
            <Heading>Many brands. One destination.</Heading>
            <Text style={styles.text}>
              This installation needs its Brandista connection configured before shopping or signing
              in. Your existing customer account and orders remain on the server.
            </Text>
            <Button title="Connection help" onPress={() => setHelp(true)} />
          </>
        )}
      </Screen>
    </SafeAreaView>
  )
}

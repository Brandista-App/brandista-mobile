import { Text, View } from 'react-native'
import { ApiError } from '../lib/client'
import { Button, ErrorMessage, Heading, styles } from './components'

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.card}>
      <Heading>{title}</Heading>
      <Text style={styles.text}>{message}</Text>
    </View>
  )
}

export function ConnectionError({ error, retry }: { error: Error | null; retry: () => void }) {
  if (!error) return null
  return (
    <View style={styles.card}>
      {error instanceof ApiError && error.status === 0 ? (
        <Heading>Connection unavailable</Heading>
      ) : null}
      <ErrorMessage error={error} />
      <Button title="Retry" onPress={retry} />
    </View>
  )
}

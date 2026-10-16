import type { PropsWithChildren, ReactNode } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useAuth } from '../state/auth'
import { theme } from './theme'
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.paper },
  content: { padding: 20, gap: 16, width: '100%', maxWidth: 720, alignSelf: 'center' },
  title: { fontSize: 30, fontWeight: '700', color: theme.ink },
  heading: { fontSize: 21, fontWeight: '600', color: theme.ink },
  text: { fontSize: 16, lineHeight: 24, color: theme.ink },
  muted: { fontSize: 14, lineHeight: 21, color: theme.muted },
  card: {
    padding: 18,
    gap: 10,
    backgroundColor: theme.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.line,
  },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  button: {
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '600', color: theme.white },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 12,
    borderRadius: 10,
    color: theme.ink,
    backgroundColor: theme.white,
  },
  error: { color: theme.danger, fontSize: 15, lineHeight: 22 },
})
export function Button({
  title,
  onPress,
  disabled = false,
}: {
  title: string
  onPress: () => void
  disabled?: boolean
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.button, { opacity: disabled ? 0.45 : pressed ? 0.7 : 1 }]}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  )
}
export function Heading({ children }: PropsWithChildren) {
  return (
    <Text accessibilityRole="header" style={styles.heading}>
      {children}
    </Text>
  )
}
export function Screen({
  title,
  children,
  refreshing,
  onRefresh,
}: {
  title: string
  children: ReactNode
  refreshing?: boolean
  onRefresh?: () => void
}) {
  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} />
            ) : undefined
          }
        >
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
export function Field({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.text}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.muted}
        style={styles.input}
        {...props}
      />
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  )
}
export function ErrorMessage({ error }: { error: unknown }) {
  return error ? (
    <Text accessibilityRole="alert" style={styles.error}>
      {error instanceof Error ? error.message : 'Please try again.'}
    </Text>
  ) : null
}
export function Loading() {
  return <ActivityIndicator accessibilityLabel="Loading" size="large" color={theme.ink} />
}
export function Gate({ children }: PropsWithChildren) {
  const { session, notice } = useAuth()
  if (!session)
    return (
      <Screen title="Sign in to continue">
        <Text style={styles.text}>
          {notice || 'Your cart, addresses and orders belong to your customer account.'}
        </Text>
        <Button title="Sign in" onPress={() => router.push('/sign-in')} />
      </Screen>
    )
  return <>{children}</>
}
export function ProductImage({ uri, label }: { uri?: string | null; label: string }) {
  return uri ? (
    <Image
      accessibilityLabel={label}
      source={{ uri }}
      style={{ height: 180, borderRadius: 12 }}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={150}
    />
  ) : (
    <View
      accessibilityLabel="Product photo unavailable"
      style={{
        height: 110,
        borderRadius: 12,
        backgroundColor: theme.paper,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={styles.muted}>Product photo unavailable</Text>
    </View>
  )
}

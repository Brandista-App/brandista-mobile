import { useRef, useState } from 'react'
import { Text } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '../state/auth'
import { api } from '../lib/runtime'
import { authErrors } from '../lib/validation'
import { ApiError } from '../lib/client'
import { Button, ErrorMessage, Field, Screen, styles } from '../ui/components'
export default function SignIn() {
  const [registration, setRegistration] = useState(false),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [visible, setVisible] = useState(false),
    [busy, setBusy] = useState(false),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [error, setError] = useState<unknown>(null),
    [registered, setRegistered] = useState(false)
  const locked = useRef(false)
  const { signIn, notice } = useAuth()
  const submit = async () => {
    const fields = authErrors(email, password, registration)
    setErrors(fields)
    if (Object.keys(fields).length || locked.current) return
    locked.current = true
    setBusy(true)
    setError(null)
    try {
      if (registration) {
        await api.register(email.trim().toLowerCase(), password)
        setRegistered(true)
        setRegistration(false)
        setPassword('')
      } else {
        await signIn(email, password)
        setPassword('')
        router.replace('/account')
      }
    } catch (e) {
      setError(e)
      if (e instanceof ApiError)
        setErrors(Object.fromEntries(e.fieldErrors.map((f) => [f.field, f.message])))
    } finally {
      locked.current = false
      setBusy(false)
    }
  }
  return (
    <Screen title={registration ? 'Create your account' : 'Welcome back'}>
      <Text style={styles.muted}>{notice}</Text>
      {registered ? (
        <Text style={styles.text}>Account created. Sign in with your password.</Text>
      ) : null}
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        error={errors.email}
      />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete={registration ? 'new-password' : 'current-password'}
        error={errors.password}
      />
      <Button
        title={visible ? 'Hide password' : 'Show password'}
        onPress={() => setVisible((v) => !v)}
      />
      {registration ? (
        <Text style={styles.muted}>At least 12 characters; at most 72 UTF-8 bytes.</Text>
      ) : null}
      <ErrorMessage error={error} />
      <Button
        title={busy ? 'Please wait…' : registration ? 'Register' : 'Sign in'}
        disabled={busy}
        onPress={() => void submit()}
      />
      <Button
        title={registration ? 'Already have an account?' : 'Create a customer account'}
        disabled={busy}
        onPress={() => {
          setRegistration((v) => !v)
          setErrors({})
          setError(null)
        }}
      />
    </Screen>
  )
}

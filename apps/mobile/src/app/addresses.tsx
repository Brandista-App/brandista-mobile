import { useState } from 'react'
import { Alert, Text, View } from 'react-native'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api, queryClient } from '../lib/runtime'
import { useAuth } from '../state/auth'
import { addressErrors } from '../lib/validation'
import { ApiError } from '../lib/client'
import type { Address, AddressInput } from '../lib/types'
import { Button, ErrorMessage, Field, Gate, Loading, Screen, styles } from '../ui/components'
const empty = {
  recipientName: '',
  phoneNumber: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  province: '',
  postalCode: '',
  deliveryInstructions: '',
}
const labels: Record<keyof typeof empty, string> = {
  recipientName: 'Recipient name',
  phoneNumber: 'Phone number',
  addressLine1: 'Address line 1',
  addressLine2: 'Address line 2 (optional)',
  city: 'City',
  province: 'Province / region',
  postalCode: 'Postal code (optional)',
  deliveryInstructions: 'Delivery instructions (optional)',
}
function Contents() {
  const { session } = useAuth()
  const q = useQuery({ queryKey: ['addresses', session!.account.id], queryFn: api.addresses })
  const [input, setInput] = useState(empty),
    [editing, setEditing] = useState<number>(),
    [errors, setErrors] = useState<Record<string, string>>({})
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['addresses'] })
  const mutation = useMutation({
    mutationFn: (action: () => Promise<unknown>) => action(),
    onSuccess: () => {
      setInput(empty)
      setEditing(undefined)
      setErrors({})
    },
    onError: (e) => {
      if (e instanceof ApiError)
        setErrors(Object.fromEntries(e.fieldErrors.map((f) => [f.field, f.message])))
    },
    onSettled: refresh,
  })
  const edit = (a: Address) => {
    setEditing(a.id)
    setErrors({})
    setInput(
      Object.fromEntries(
        Object.keys(empty).map((k) => [k, a[k as keyof Address] ?? '']),
      ) as typeof empty,
    )
  }
  const save = () => {
    const e = addressErrors(input)
    setErrors(e)
    if (!Object.keys(e).length) {
      const body = Object.fromEntries(
        Object.entries(input).map(([k, v]) => [k, v.trim()]),
      ) as AddressInput
      mutation.mutate(() => api.saveAddress(body, editing))
    }
  }
  return (
    <Screen
      title="Delivery addresses"
      refreshing={q.isRefetching}
      onRefresh={() => void q.refetch()}
    >
      {q.isPending ? <Loading /> : null}
      <ErrorMessage error={q.error} />
      {q.isError ? <Button title="Retry" onPress={() => void q.refetch()} /> : null}
      {q.data?.map((a) => (
        <View key={a.id} style={styles.card}>
          <Text style={styles.heading}>
            {a.recipientName}
            {a.isDefault ? ' · Default' : ''}
          </Text>
          <Text style={styles.text}>
            {a.addressLine1}
            {a.addressLine2 ? `, ${a.addressLine2}` : ''}
            {'\n'}
            {a.city}, {a.province}
            {'\n'}
            {a.phoneNumber}
          </Text>
          <View style={styles.row}>
            <Button title="Edit" disabled={mutation.isPending} onPress={() => edit(a)} />
            <Button
              title="Make default"
              disabled={mutation.isPending || a.isDefault}
              onPress={() => mutation.mutate(() => api.defaultAddress(a.id))}
            />
            <Button
              title="Delete"
              disabled={mutation.isPending}
              onPress={() =>
                Alert.alert('Delete address?', 'Placed orders retain their delivery snapshot.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => mutation.mutate(() => api.deleteAddress(a.id)),
                  },
                ])
              }
            />
          </View>
        </View>
      ))}
      {q.data?.length === 0 ? (
        <Text style={styles.text}>Add your first delivery address.</Text>
      ) : null}
      <Text style={styles.heading}>{editing ? 'Edit address' : 'New address'}</Text>
      {(Object.keys(empty) as (keyof typeof empty)[]).map((k) => (
        <Field
          key={k}
          label={labels[k]}
          value={input[k]}
          error={errors[k]}
          keyboardType={k === 'phoneNumber' ? 'phone-pad' : 'default'}
          multiline={k === 'deliveryInstructions'}
          onChangeText={(v) => setInput((s) => ({ ...s, [k]: v }))}
        />
      ))}
      <ErrorMessage error={mutation.error} />
      <Button title="Save address" disabled={mutation.isPending} onPress={save} />
      {editing ? (
        <Button
          title="Cancel edit"
          onPress={() => {
            setEditing(undefined)
            setInput(empty)
            setErrors({})
          }}
        />
      ) : null}
    </Screen>
  )
}
export default function Addresses() {
  return (
    <Gate>
      <Contents />
    </Gate>
  )
}

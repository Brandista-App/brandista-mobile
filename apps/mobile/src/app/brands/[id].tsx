import { useLocalSearchParams } from 'expo-router'
import { Catalogue } from '../../ui/catalogue'
import { Screen } from '../../ui/components'
import { Text } from 'react-native'
export default function Storefront() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const value = Number(id)
  if (!Number.isInteger(value) || value < 1)
    return (
      <Screen title="Brand unavailable">
        <Text>Invalid brand.</Text>
      </Screen>
    )
  return <Catalogue brandId={value} />
}

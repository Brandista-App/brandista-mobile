import { Image } from 'expo-image'

export function BrandMark() {
  return (
    <Image
      source={require('../../../brand-assets/brandista-approved-logo.jpeg.jpeg')}
      accessibilityLabel="Brandista — Many brands. One destination."
      contentFit="contain"
      style={{ width: 180, height: 180, alignSelf: 'center' }}
    />
  )
}

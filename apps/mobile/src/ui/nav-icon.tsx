import { View, type ColorValue } from 'react-native'
// Native geometric icons: no downloadable fonts or private-use glyphs.
export function NavIcon({ name, color }: { name: string; color: ColorValue }) {
  const line = { borderColor: color, borderWidth: 1.7 }
  if (name === 'catalogue')
    return (
      <View
        accessibilityElementsHidden
        style={{ width: 20, height: 20, borderRadius: 10, ...line }}
      >
        <View
          style={{
            position: 'absolute',
            right: -5,
            bottom: -3,
            height: 9,
            width: 2,
            backgroundColor: color,
            transform: [{ rotate: '-45deg' }],
          }}
        />
      </View>
    )
  if (name === 'brands')
    return (
      <View
        accessibilityElementsHidden
        style={{ width: 22, height: 22, flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}
      >
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ width: 9, height: 9, borderRadius: 2, ...line }} />
        ))}
      </View>
    )
  if (name === 'account')
    return (
      <View
        accessibilityElementsHidden
        style={{ width: 24, height: 24, alignItems: 'center', gap: 2 }}
      >
        <View style={{ width: 9, height: 9, borderRadius: 6, ...line }} />
        <View
          style={{
            width: 21,
            height: 11,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            ...line,
          }}
        />
      </View>
    )
  return (
    <View
      accessibilityElementsHidden
      style={{ width: 21, height: 19, marginTop: 4, borderRadius: 3, ...line }}
    >
      <View
        style={{
          position: 'absolute',
          width: 11,
          height: 9,
          top: -7,
          left: 3,
          borderRadius: name === 'cart' ? 8 : 1,
          transform: name === 'cart' ? [] : [{ rotate: '45deg' }],
          ...line,
        }}
      />
    </View>
  )
}

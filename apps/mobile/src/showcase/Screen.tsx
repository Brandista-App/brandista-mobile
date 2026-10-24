import { useState, useCallback } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router'
import { Button, Field, Screen, styles } from '../ui/components'
import { BrandMark } from '../ui/brand'
import { theme } from '../ui/theme'
import { base, configurationError } from '../lib/runtime'
import { pkr } from '../lib/validation'
import { brands, products, categories, cartTotal, type DemoProduct } from './catalogue'
import { useShowcase } from './state'
import { NavIcon } from '../ui/nav-icon'
import { SafeAreaView } from 'react-native-safe-area-context'
const photo = require('../../assets/showcase/editorial.png')
const rose = require('../../assets/showcase/rose.png')
const accessories = require('../../assets/showcase/accessories.png')
const go = (view: string, extra: Record<string, string> = {}) =>
  router.push({ pathname: '/showcase', params: { view, ...extra } })
function Chip({
  label,
  active,
  onPress,
  accessibilityLabel,
}: {
  label: string
  active?: boolean
  onPress: () => void
  accessibilityLabel?: string
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={[s.chip, active && { backgroundColor: theme.ink }]}
    >
      <Text style={{ color: active ? theme.white : theme.ink, fontSize: 13 }}>{label}</Text>
    </Pressable>
  )
}
function Photo({ product, large = false }: { product?: DemoProduct; large?: boolean }) {
  return (
    <Image
      source={
        product?.category === 'Accessories'
          ? accessories
          : product?.brand === 'Gul Studio'
            ? rose
            : photo
      }
      accessibilityLabel={product?.name || 'Original demonstration fashion collection'}
      contentFit="cover"
      style={{ width: '100%', aspectRatio: large ? 0.85 : 0.78, borderRadius: 14 }}
    />
  )
}
function Cards({ items }: { items: DemoProduct[] }) {
  return (
    <View style={s.grid}>
      {items.map((p) => (
        <Pressable
          key={p.id}
          accessibilityRole="button"
          accessibilityLabel={`View ${p.name}`}
          onPress={() => go('product', { id: p.id })}
          style={s.product}
        >
          <Photo product={p} />
          <Text style={s.eyebrow}>{p.brand.toUpperCase()}</Text>
          <Text style={s.productName}>{p.name}</Text>
          <Text style={s.price}>{pkr(p.price)}</Text>
        </Pressable>
      ))}
    </View>
  )
}
export default function ShowcaseScreen() {
  const params = useLocalSearchParams<{
    view?: string
    id?: string
    brand?: string
    category?: string
  }>()
  const view = params.view || 'home'
  const { cart, change, clear, setDemo, storageNotice } = useShowcase()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [size, setSize] = useState('')
  const [added, setAdded] = useState('')
  const [review, setReview] = useState(false)
  const [checking, setChecking] = useState(false)
  const [liveError, setLiveError] = useState('')
  useFocusEffect(
    useCallback(() => {
      setDemo(true)
    }, [setDemo]),
  )
  const total = cartTotal(cart)
  const count = cart.reduce((n, l) => n + l.quantity, 0)
  const selected = products.find((p) => p.id === params.id)
  const startLive = async () => {
    setLiveError('')
    setChecking(true)
    try {
      if (
        process.env.EXPO_PUBLIC_OFFLINE_SHOWCASE === '1' ||
        configurationError ||
        !base ||
        base.includes('.invalid')
      )
        throw new Error(
          'Live shopping is awaiting an approved backend deployment. You can explore the entire showcase offline.',
        )
      const response = await fetch(`${base}/products?page=0&size=1`, {
        signal: AbortSignal.timeout(12000),
      })
      if (!response.ok || !Array.isArray((await response.json()).content))
        throw new Error('unavailable')
      setDemo(false)
      router.replace('/')
    } catch (e) {
      setLiveError(
        e instanceof Error && e.message.startsWith('Live shopping')
          ? e.message
          : 'The shopping service is unavailable. Retry when connected, or continue with the offline showcase.',
      )
    } finally {
      setChecking(false)
    }
  }
  const title =
    (
      {
        home: 'Discover',
        brands: 'The brand edit',
        catalogue: 'Find your next favourite',
        product: selected?.name || 'Product unavailable',
        cart: 'Your demo bag',
        checkout: 'Demo checkout',
        confirmation: 'A beautiful beginning',
        account: 'Welcome to Brandista',
        live: 'Shop live',
      } as Record<string, string>
    )[view] || 'Discover'
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.paper }}>
      <View style={s.mode}>
        <Text style={s.modeText}>OFFLINE SHOWCASE · DEMO MODE</Text>
        <Pressable accessibilityRole="button" onPress={() => go('live')}>
          <Text style={s.modeLink}>Shop live →</Text>
        </Pressable>
      </View>
      <Screen
        title={title}
        scrollKey={`${view}:${params.id || params.brand || params.category || ''}`}
      >
        {view !== 'home' && (
          <Pressable
            accessibilityRole="button"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/showcase'))}
          >
            <Text style={styles.muted}>← Back to the edit</Text>
          </Pressable>
        )}
        {view === 'home' && (
          <>
            <BrandMark />
            <Text style={s.tagline}>MANY BRANDS. ONE DESTINATION.</Text>
            <View style={s.hero}>
              <Image source={photo} contentFit="cover" style={s.heroImage} />
              <View style={s.heroCopy}>
                <Text style={s.eyebrow}>THE EVERYDAY ELEGANCE EDIT</Text>
                <Text style={s.display}>
                  Made for{'\n'}your kind{'\n'}of beautiful.
                </Text>
                <Text style={styles.muted}>Discover a considered world of style.</Text>
                <Button title="Explore the edit" onPress={() => go('catalogue')} />
              </View>
            </View>
            <Text style={s.section}>Many labels. Your own style.</Text>
            <Text style={styles.muted}>
              Discover the marketplace through fictional demonstration collections. No brand
              partnerships are implied.
            </Text>
            <View style={styles.row}>
              {categories.slice(1).map((c) => (
                <Chip key={c} label={c} onPress={() => go('catalogue', { category: c })} />
              ))}
            </View>
            <Text style={s.section}>Meet your next favourite brand</Text>
            {brands.map((b, i) => (
              <Pressable
                accessibilityRole="button"
                key={b.name}
                style={[s.brand, { backgroundColor: b.color }]}
                onPress={() => go('catalogue', { brand: b.name })}
              >
                <Text style={s.brandMonogram}>{['M', 'G', 'S'][i]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.productName}>{b.name}</Text>
                  <Text style={styles.muted}>{b.note}</Text>
                  <Text style={s.eyebrow}>FICTIONAL DEMO BRAND</Text>
                </View>
                <Text style={s.price}>→</Text>
              </Pressable>
            ))}
            <Text style={s.section}>New arrivals, thoughtfully chosen</Text>
            <Cards items={products.slice(0, 4)} />
            <View style={s.promo}>
              <Text style={s.eyebrow}>A LITTLE SOMETHING SPECIAL</Text>
              <Text style={s.section}>The finishing touch.</Text>
              <Text style={styles.muted}>Discover the details that make a look yours.</Text>
              <Button
                title="Explore accessories"
                onPress={() => go('catalogue', { category: 'Accessories' })}
              />
            </View>
            <Text style={s.section}>The occasion edit</Text>
            <Cards items={products.slice(4)} />
          </>
        )}
        {view === 'brands' && (
          <>
            <Text style={styles.muted}>
              Independent style, one destination. All labels below are fictional showcase brands.
            </Text>
            {brands.map((b) => (
              <Pressable
                accessibilityRole="button"
                key={b.name}
                style={[styles.card, { backgroundColor: b.color }]}
                onPress={() => go('catalogue', { brand: b.name })}
              >
                <Text style={s.section}>{b.name}</Text>
                <Text style={styles.muted}>{b.note}</Text>
                <Text style={s.eyebrow}>EXPLORE DEMO COLLECTION →</Text>
              </Pressable>
            ))}
          </>
        )}
        {view === 'catalogue' && (
          <>
            {params.brand && <Text style={s.section}>{params.brand}</Text>}
            <Field
              label="Search the demo collection"
              value={search}
              onChangeText={setSearch}
              placeholder="Try lawn, rose or a brand name"
            />
            <View style={styles.row}>
              {categories.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  active={(params.category || category) === c}
                  onPress={() => {
                    setCategory(c)
                    router.setParams({ category: '' })
                  }}
                />
              ))}
            </View>
            {(() => {
              const items = products.filter(
                (p) =>
                  (!params.brand || p.brand === params.brand) &&
                  ((params.category || category) === 'All' ||
                    p.category === (params.category || category)) &&
                  `${p.name} ${p.brand} ${p.description}`
                    .toLowerCase()
                    .includes(search.toLowerCase()),
              )
              return items.length ? (
                <Cards items={items} />
              ) : (
                <Text style={styles.muted}>
                  No matching pieces. Try another search or category.
                </Text>
              )
            })()}
          </>
        )}
        {view === 'product' && selected && (
          <>
            <Photo product={selected} large />
            <Text style={s.eyebrow}>{selected.brand} · FICTIONAL DEMO BRAND</Text>
            <Text style={s.section}>{pkr(selected.price)}</Text>
            <Text style={styles.text}>{selected.description}</Text>
            <Text style={styles.muted}>Illustrative AI imagery; demo product only.</Text>
            <Text style={s.productName}>Select an option</Text>
            <View style={styles.row}>
              {selected.sizes.map((v) => (
                <Chip
                  key={v}
                  label={v}
                  active={(selected.sizes.includes(size) ? size : selected.sizes[0]) === v}
                  onPress={() => setSize(v)}
                />
              ))}
            </View>
            <Button
              title="Add to demo bag"
              onPress={() => {
                const option = selected.sizes.includes(size) ? size : selected.sizes[0]
                const line = cart.find((l) => l.id === selected.id && l.size === option)
                change(selected.id, option, (line?.quantity || 0) + 1)
                setAdded(selected.id)
              }}
            />
            {added === selected.id && (
              <Text accessibilityLiveRegion="polite" style={styles.text}>
                Added to your demo bag. Maximum 10 per option.
              </Text>
            )}
            <Button title="View demo bag" onPress={() => go('cart')} />
          </>
        )}
        {view === 'cart' && (
          <>
            <Text style={styles.muted}>
              A local demonstration bag. These items never enter a real account or live checkout.
            </Text>
            {cart.length === 0 && (
              <>
                <Text style={s.section}>Room for something beautiful.</Text>
                <Button title="Discover the collection" onPress={() => go('catalogue')} />
              </>
            )}
            {cart.map((l) => {
              const p = products.find((p) => p.id === l.id)!
              return (
                <View key={`${l.id}-${l.size}`} style={styles.card}>
                  <Text style={s.eyebrow}>{p.brand}</Text>
                  <Text style={s.productName}>
                    {p.name} · {l.size}
                  </Text>
                  <Text style={s.price}>{pkr(p.price * l.quantity)}</Text>
                  <View style={styles.row}>
                    <Chip
                      label="−"
                      accessibilityLabel={`Decrease ${p.name}`}
                      onPress={() => change(l.id, l.size, l.quantity - 1)}
                    />
                    <Text style={styles.text}>{l.quantity}</Text>
                    <Chip
                      label="+"
                      accessibilityLabel={`Increase ${p.name}`}
                      onPress={() => change(l.id, l.size, l.quantity + 1)}
                    />
                    <Chip label="Remove" onPress={() => change(l.id, l.size, 0)} />
                  </View>
                </View>
              )
            })}
            {cart.length > 0 && (
              <>
                <Text style={s.section}>Subtotal {pkr(total)}</Text>
                <Button
                  title="Explore demo checkout"
                  onPress={() => {
                    setReview(false)
                    go('checkout')
                  }}
                />
              </>
            )}
          </>
        )}
        {view === 'checkout' && (
          <>
            <Text style={s.eyebrow}>SIMULATION ONLY · NO PURCHASE</Text>
            <Text style={styles.text}>
              Explore the cash-on-delivery journey using fictional delivery details. No personal
              information is collected.
            </Text>
            <View style={styles.card}>
              <Text style={s.productName}>Demo guest</Text>
              <Text style={styles.text}>Example residence, Lahore, Punjab</Text>
              <Text style={styles.muted}>Illustrative address · no delivery will take place</Text>
            </View>
            <View style={styles.card}>
              <Text style={s.productName}>Payment on delivery</Text>
              <Text style={styles.muted}>Simulated COD · no payment or stock reservation</Text>
              <Text style={s.section}>{pkr(total)}</Text>
              <Text style={styles.muted}>Demo delivery, tax and discounts: PKR 0</Text>
            </View>
            {review &&
              cart.map((l) => (
                <Text key={`${l.id}-${l.size}`} style={styles.text}>
                  {products.find((p) => p.id === l.id)!.name} · {l.size} × {l.quantity}
                </Text>
              ))}
            {!review ? (
              <Button
                title="Review simulated order"
                disabled={!cart.length}
                onPress={() => setReview(true)}
              />
            ) : (
              <Button
                title="Confirm simulated order — no purchase"
                disabled={!cart.length}
                onPress={() => {
                  clear()
                  router.replace({ pathname: '/showcase', params: { view: 'confirmation' } })
                }}
              />
            )}
          </>
        )}
        {view === 'confirmation' && (
          <View style={s.promo}>
            <Text style={s.eyebrow}>SIMULATED ORDER CONFIRMATION</Text>
            <Text style={s.section}>Thank you for exploring.</Text>
            <Text style={styles.text}>
              This was a demonstration. No order was submitted, no payment is due and no delivery
              will occur.
            </Text>
            <Button title="Continue discovering" onPress={() => router.replace('/showcase')} />
          </View>
        )}
        {view === 'account' && (
          <>
            <BrandMark />
            <Text style={s.section}>Your world of discovery.</Text>
            <Text style={styles.text}>
              Explore freely without an account. This showcase uses fictional products and a private
              local demo bag.
            </Text>
            <Button title="Explore live shopping" onPress={() => go('live')} />
            <Text style={styles.muted}>
              Live accounts, saved addresses and order history become available through the
              configured shopping service. Demo activity is never synced.
            </Text>
          </>
        )}
        {view === 'live' && (
          <>
            <Text style={s.section}>Ready when you are.</Text>
            <Text style={styles.text}>
              Live shopping uses the Brandista service for accounts, catalogue, cart, delivery
              addresses and cash-on-delivery orders. Your demo bag stays separate.
            </Text>
            <Button
              title={checking ? 'Checking shopping service…' : 'Connect to live shopping'}
              disabled={checking}
              onPress={() => void startLive()}
            />
            {liveError ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {liveError}
              </Text>
            ) : null}
            <Button title="Continue offline showcase" onPress={() => router.replace('/showcase')} />
          </>
        )}
        {!!storageNotice && <Text style={styles.muted}>{storageNotice}</Text>}
        <Text style={s.footer}>
          BRANDISTA{'\n'}MANY BRANDS. ONE DESTINATION.{'\n'}Fictional demo catalogue · No real
          purchases
        </Text>
      </Screen>
      <View style={s.nav}>
        {[
          ['home', 'Home'],
          ['brands', 'Brands'],
          ['catalogue', 'Explore'],
          ['cart', `Bag${count ? ` (${count})` : ''}`],
          ['account', 'You'],
        ].map(([key, label]) => (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: view === key }}
            accessibilityLabel={label}
            style={s.navItem}
            onPress={() => {
              setSearch('')
              setCategory('All')
              router.replace({ pathname: '/showcase', params: { view: key } })
            }}
          >
            <NavIcon name={key} color={view === key ? theme.ink : theme.muted} />
            <Text
              style={{
                fontSize: 11,
                color: view === key ? theme.ink : theme.muted,
                fontWeight: view === key ? '700' : '400',
              }}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  )
}
const s = StyleSheet.create({
  mode: {
    backgroundColor: theme.ink,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  modeText: { color: '#F7F3EB', fontSize: 10, letterSpacing: 1.2 },
  modeLink: { color: '#F0D5A0', fontSize: 11 },
  tagline: {
    textAlign: 'center',
    fontSize: 10,
    letterSpacing: 2,
    color: theme.muted,
    marginTop: -20,
    marginBottom: 10,
  },
  hero: { backgroundColor: '#E9DFCF', borderRadius: 20, overflow: 'hidden', minHeight: 400 },
  heroImage: { position: 'absolute', right: 0, width: '62%', height: '100%' },
  heroCopy: {
    backgroundColor: '#F4ECE0ED',
    width: '63%',
    minHeight: 400,
    padding: 20,
    gap: 17,
    justifyContent: 'center',
  },
  display: { fontFamily: theme.headingFont, fontSize: 35, lineHeight: 40, color: theme.ink },
  eyebrow: { fontSize: 10, letterSpacing: 1.2, color: theme.muted, marginTop: 6, lineHeight: 16 },
  section: {
    fontFamily: theme.headingFont,
    fontSize: 26,
    lineHeight: 33,
    color: theme.ink,
    marginTop: 8,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  product: { width: '47%', gap: 5, marginBottom: 16 },
  productName: { fontSize: 16, color: theme.ink, fontWeight: '600', lineHeight: 22 },
  price: { fontSize: 15, color: theme.ink, fontWeight: '600' },
  chip: {
    padding: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.white,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  brandMonogram: { fontFamily: theme.headingFont, fontSize: 42, color: theme.ink },
  promo: { backgroundColor: '#EDDFD8', padding: 24, gap: 15, borderRadius: 18 },
  nav: {
    flexDirection: 'row',
    backgroundColor: theme.white,
    borderTopWidth: 1,
    borderTopColor: theme.line,
    paddingTop: 10,
    paddingBottom: 18,
  },
  navItem: { flex: 1, alignItems: 'center', gap: 6, minHeight: 48 },
  footer: {
    textAlign: 'center',
    color: theme.muted,
    fontSize: 10,
    lineHeight: 22,
    letterSpacing: 1,
    paddingVertical: 25,
  },
})

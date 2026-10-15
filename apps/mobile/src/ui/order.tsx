import { Text, View } from 'react-native'
import type { CheckoutReview, CustomerOrder } from '../lib/types'
import { pkr } from '../lib/validation'
import { styles } from './components'
export function OrderSummary({ order }: { order: CheckoutReview | CustomerOrder }) {
  const d = order.deliveryAddress
  return (
    <View style={{ gap: 14 }}>
      <View style={styles.card}>
        <Text style={styles.heading}>Deliver to {d.recipientName}</Text>
        <Text style={styles.text}>
          {d.addressLine1}
          {d.addressLine2 ? `, ${d.addressLine2}` : ''}
          {'\n'}
          {d.city}, {d.province} {d.postalCode}
          {'\n'}
          {d.phoneNumber}
        </Text>
        {d.deliveryInstructions ? <Text style={styles.text}>{d.deliveryInstructions}</Text> : null}
      </View>
      {order.items.map((i) => (
        <View key={i.productId} style={styles.card}>
          <Text style={styles.muted}>{i.brandName}</Text>
          <Text style={styles.heading}>{i.productName}</Text>
          <Text style={styles.text}>
            {i.quantity} × {pkr(i.unitPrice)} = {pkr(i.lineSubtotal)}
          </Text>
        </View>
      ))}
      <View style={styles.card}>
        <Text style={styles.text}>Subtotal {pkr(order.subtotal)}</Text>
        <Text style={styles.text}>Delivery {pkr(order.deliveryCharge)}</Text>
        <Text style={styles.text}>Tax {pkr(order.tax)}</Text>
        <Text style={styles.text}>Discount {pkr(order.discount)}</Text>
        <Text style={styles.heading}>Total {pkr(order.total)}</Text>
        <Text style={styles.text}>Cash on Delivery · Unpaid</Text>
      </View>
    </View>
  )
}

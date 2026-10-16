export function authErrors(email: string, password: string, registration: boolean) {
  const errors: Record<string, string> = {}
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.length > 254)
    errors.email = 'Enter a valid email.'
  const bytes = Array.from(password).reduce((n, c) => {
    const point = c.codePointAt(0)!
    return n + (point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4)
  }, 0)
  if (!password.trim()) errors.password = 'Enter your password.'
  else if (bytes > 72 || (registration && Array.from(password).length < 12))
    errors.password = 'Use at least 12 characters and at most 72 UTF-8 bytes.'
  return errors
}
export function addressErrors(input: Record<string, string>) {
  const errors: Record<string, string> = {}
  for (const [name, max] of Object.entries({
    recipientName: 120,
    phoneNumber: 25,
    addressLine1: 255,
    city: 100,
    province: 100,
    addressLine2: 255,
    postalCode: 20,
    deliveryInstructions: 500,
  })) {
    const value = input[name]?.trim() || ''
    if (
      ['recipientName', 'phoneNumber', 'addressLine1', 'city', 'province'].includes(name) &&
      !value
    )
      errors[name] = 'Required.'
    else if (value.length > max) errors[name] = `Maximum ${max} characters.`
  }
  const digits = (input.phoneNumber || '').replace(/\D/g, '')
  if (!/^[+\d\s().-]+$/.test(input.phoneNumber || '') || digits.length < 7 || digits.length > 15)
    errors.phoneNumber = 'Use 7–15 digits with common phone punctuation.'
  return errors
}
export const pkr = (value: number) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 2,
  }).format(value)

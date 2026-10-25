import { Platform } from 'react-native'
export const theme = {
  headingFont: Platform.OS === 'ios' ? 'ui-serif' : 'serif',
  paper: '#FAF6EF',
  ink: '#173D32',
  muted: '#5A665E',
  clay: '#A74730',
  line: '#DFD8CA',
  white: '#FFFFFF',
  danger: '#A02F27',
}

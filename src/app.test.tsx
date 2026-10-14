/* @vitest-environment jsdom */
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { App } from './app'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it('keeps navigation usable when catalogue requests fail', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network unavailable')))
  render(<App />)

  expect(await screen.findByRole('heading', { name: /Good finds/ })).toBeVisible()
  expect(await screen.findByRole('alert')).toHaveTextContent('We could not reach Brandista')

  const menu = screen.getByRole('button', { name: /Toggle menu/ })
  fireEvent.click(menu)
  expect(menu).toHaveAttribute('aria-expanded', 'true')
  fireEvent.click(
    within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole('link', {
      name: 'Our brands',
    }),
  )

  expect(await screen.findByRole('heading', { name: 'Meet the makers' })).toBeVisible()
  expect(await screen.findByRole('alert')).toHaveTextContent('We could not reach Brandista')
})

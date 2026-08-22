'use client'

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

/**
 * Android hardware back: go one history step back instead of closing/minimizing.
 */
export function CapacitorBackButton() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let remove: (() => void) | undefined

    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack || window.history.length > 1) {
        window.history.back()
        return
      }
      // Already at root of app history — minimize instead of force-exit
      App.minimizeApp()
    }).then((handle) => {
      remove = () => {
        handle.remove()
      }
    })

    return () => {
      remove?.()
    }
  }, [])

  return null
}

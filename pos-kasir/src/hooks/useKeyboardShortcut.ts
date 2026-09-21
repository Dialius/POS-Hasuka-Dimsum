import { useEffect } from 'react'

interface ShortcutOptions {
  enabled?: boolean
  preventDefault?: boolean
}

export function useKeyboardShortcut(
  key: string,
  callback: (e: KeyboardEvent) => void,
  options: ShortcutOptions = {}
) {
  const { enabled = true, preventDefault = true } = options

  useEffect(() => {
    if (!enabled) return

    const handler = (e: KeyboardEvent) => {
      const parts = key.toLowerCase().split('+')
      const targetKey = parts[parts.length - 1]
      const needsCtrl = parts.includes('ctrl')
      const needsShift = parts.includes('shift')
      const needsAlt = parts.includes('alt')

      const matches =
        e.key.toLowerCase() === targetKey &&
        e.ctrlKey === needsCtrl &&
        e.shiftKey === needsShift &&
        e.altKey === needsAlt

      if (matches) {
        if (preventDefault) e.preventDefault()
        callback(e)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [key, callback, enabled, preventDefault])
}

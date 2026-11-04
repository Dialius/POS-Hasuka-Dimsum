import { useState, useEffect, useRef, useCallback } from 'react'

const POSITION_STORAGE_KEY = 'hasuka_ai_widget_pos'
const DRAG_THRESHOLD_PX = 5
const MARGIN_PX = 12

export interface WidgetPosition {
  x: number
  y: number
  side: 'left' | 'right'
}

interface UseDraggableOptions {
  isOpen: boolean
  elementRef: React.RefObject<HTMLElement | null>
}

export function useDraggable({ isOpen, elementRef }: UseDraggableOptions) {
  const [position, setPosition] = useState<WidgetPosition>(() => {
    try {
      const saved = localStorage.getItem(POSITION_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return {
            x: parsed.x,
            y: parsed.y,
            side: parsed.side === 'left' ? 'left' : 'right'
          }
        }
      }
    } catch { /* ignore */ }

    // Posisi awal kanan-bawah
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
    const vh = typeof window !== 'undefined' ? window.innerHeight : 768
    return {
      x: vw - 68,
      y: vh - 80,
      side: 'right'
    }
  })

  const [isDragging, setIsDragging] = useState(false)
  const isPointerDownRef = useRef(false)
  const startPointerRef = useRef({ x: 0, y: 0 })
  const startPosRef = useRef({ x: 0, y: 0 })
  const hasMovedPastThresholdRef = useRef(false)
  const isClickSuppressedRef = useRef(false)

  // Re-clamp position within viewport helper
  const clampAndSnap = useCallback((currX: number, currY: number, targetSide?: 'left' | 'right'): WidgetPosition => {
    const el = elementRef.current
    const w = el ? el.offsetWidth : (isOpen ? 360 : 52)
    const h = el ? el.offsetHeight : (isOpen ? 480 : 52)
    const vw = window.innerWidth
    const vh = window.innerHeight

    const side = targetSide || (currX + w / 2 < vw / 2 ? 'left' : 'right')
    const finalX = side === 'left' ? MARGIN_PX : Math.max(MARGIN_PX, vw - w - MARGIN_PX)
    const finalY = Math.max(MARGIN_PX, Math.min(currY, Math.max(MARGIN_PX, vh - h - MARGIN_PX)))

    return { x: finalX, y: finalY, side }
  }, [isOpen, elementRef])

  // Handle resize & orientation change
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        const clamped = clampAndSnap(prev.x, prev.y, prev.side)
        try {
          localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(clamped))
        } catch { /* ignore */ }
        return clamped
      })
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [clampAndSnap])

  // Adjust position when toggling open/close
  useEffect(() => {
    // Beri waktu sedikit untuk render DOM mengupdate dimensi
    const timer = setTimeout(() => {
      setPosition(prev => {
        const adjusted = clampAndSnap(prev.x, prev.y, prev.side)
        return adjusted
      })
    }, 20)
    return () => clearTimeout(timer)
  }, [isOpen, clampAndSnap])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Hanya tangani tombol utama (kiri / sentuh / pen)
    if (e.button !== 0) return

    isPointerDownRef.current = true
    hasMovedPastThresholdRef.current = false
    isClickSuppressedRef.current = false
    startPointerRef.current = { x: e.clientX, y: e.clientY }
    startPosRef.current = { x: position.x, y: position.y }

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch { /* ignore */ }
  }, [position])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return

    const dx = e.clientX - startPointerRef.current.x
    const dy = e.clientY - startPointerRef.current.y

    if (!hasMovedPastThresholdRef.current) {
      if (Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
        hasMovedPastThresholdRef.current = true
        isClickSuppressedRef.current = true
        setIsDragging(true)
      } else {
        return
      }
    }

    const el = elementRef.current
    const w = el ? el.offsetWidth : 52
    const h = el ? el.offsetHeight : 52
    const vw = window.innerWidth
    const vh = window.innerHeight

    const rawX = startPosRef.current.x + dx
    const rawY = startPosRef.current.y + dy

    const clampedX = Math.max(MARGIN_PX, Math.min(rawX, vw - w - MARGIN_PX))
    const clampedY = Math.max(MARGIN_PX, Math.min(rawY, vh - h - MARGIN_PX))

    setPosition({
      x: clampedX,
      y: clampedY,
      side: clampedX + w / 2 < vw / 2 ? 'left' : 'right'
    })
  }, [elementRef])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return
    isPointerDownRef.current = false

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch { /* ignore */ }

    if (hasMovedPastThresholdRef.current) {
      setIsDragging(false)
      // Snap ke tepi terdekat
      setPosition(prev => {
        const snapped = clampAndSnap(prev.x, prev.y)
        try {
          localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(snapped))
        } catch { /* ignore */ }
        return snapped
      })
    }
  }, [clampAndSnap])

  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return
    isPointerDownRef.current = false
    setIsDragging(false)
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch { /* ignore */ }
  }, [])

  return {
    position,
    isDragging,
    isClickSuppressed: isClickSuppressedRef,
    dragProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      style: {
        touchAction: 'none' as const,
        userSelect: 'none' as const
      }
    }
  }
}


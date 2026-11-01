import React, { useEffect, useState } from 'react'
import { Button } from './Button'

export const ReloadConfirmModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [hasActiveCart, setHasActiveCart] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tangkap semua tombol reload: F5, Ctrl+F5, Ctrl+R, Cmd+R, Ctrl+Shift+R, Cmd+Shift+R
      const isF5 = e.key === 'F5' || e.code === 'F5' || e.keyCode === 116
      const isR = e.key === 'r' || e.key === 'R' || e.code === 'KeyR' || e.keyCode === 82
      const isReload = isF5 || ((e.ctrlKey || e.metaKey) && isR)

      if (isReload) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation?.()
        
        const offline = typeof navigator !== 'undefined' && !navigator.onLine
        setIsOffline(offline)
        
        let cartActive = false
        try {
          const cartStr = localStorage.getItem('hasuka_active_cart')
          if (cartStr) {
            const list = JSON.parse(cartStr)
            cartActive = Array.isArray(list) && list.length > 0
          }
        } catch {}
        setHasActiveCart(cartActive)

        setIsOpen(true)
      }
    }

    // Dengarkan juga custom event jika ada tombol in-app yang memicu reload
    const handleTriggerReloadModal = () => {
      const offline = typeof navigator !== 'undefined' && !navigator.onLine
      setIsOffline(offline)
      let cartActive = false
      try {
        const cartStr = localStorage.getItem('hasuka_active_cart')
        if (cartStr) {
          const list = JSON.parse(cartStr)
          cartActive = Array.isArray(list) && list.length > 0
        }
      } catch {}
      setHasActiveCart(cartActive)
      setIsOpen(true)
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    window.addEventListener('hasuka_open_reload_modal', handleTriggerReloadModal)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
      window.removeEventListener('hasuka_open_reload_modal', handleTriggerReloadModal)
    }
  }, [])

  if (!isOpen) return null

  const handleConfirmReload = () => {
    // Bypass beforeunload agar reload langsung dieksekusi tanpa dialog native browser
    sessionStorage.setItem('hasuka_allow_reload', 'true')
    window.location.reload()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-in fade-in">
      <div 
        className="w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95" 
        style={{ background: '#F3E7CE' }}
      >
        <h3 className="font-bold text-[18px] text-[#2B1810] mb-2">Muat Ulang Halaman?</h3>
        <p className="text-[#6B5448] text-[14px] mb-6 leading-relaxed">
          {isOffline ? (
            <>
              Perangkat sedang <strong className="text-red-700">Mode Offline</strong>. Jika Anda memuat ulang sekarang, aplikasi tidak dapat diakses sementara hingga internet terhubung kembali.
            </>
          ) : hasActiveCart ? (
            <>
              Ada pesanan yang belum diselesaikan di keranjang. Pesanan Anda aman tersimpan, namun disarankan menyelesaikan transaksi terlebih dahulu.
            </>
          ) : (
            <>
              Apakah Anda yakin ingin memuat ulang halaman aplikasi kasir?
            </>
          )}
        </p>
        <div className="flex gap-4">
          <Button 
            variant="secondary"
            onClick={() => setIsOpen(false)}
            className="flex-1 py-4"
          >
            Batal
          </Button>
          <Button 
            variant="destructive"
            onClick={handleConfirmReload}
            className="flex-1 py-4"
          >
            Muat Ulang
          </Button>
        </div>
      </div>
    </div>
  )
}

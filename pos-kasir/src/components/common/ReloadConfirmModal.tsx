import React, { useEffect, useState } from 'react'
import { Button } from './Button'

export const ReloadConfirmModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [hasActiveCart, setHasActiveCart] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cegat tombol F5 dan Ctrl+R / Cmd+R agar tidak memicu dialog bawaan browser
      if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R'))) {
        e.preventDefault()
        
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
      setIsOpen(true)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('hasuka_open_reload_modal', handleTriggerReloadModal)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
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
            className="flex-1 py-4 text-base font-semibold"
          >
            Batal
          </Button>
          <Button 
            variant="destructive"
            onClick={handleConfirmReload}
            className="flex-1 py-4 text-base font-semibold"
          >
            Muat Ulang
          </Button>
        </div>
      </div>
    </div>
  )
}

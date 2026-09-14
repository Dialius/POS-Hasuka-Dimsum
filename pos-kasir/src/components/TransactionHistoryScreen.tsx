import { useState, useEffect } from 'react'
import { Search, ReceiptText, Ban, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { getLocalTransactions, updateLocalTransactionStatus } from '../services/db'
import { gasApi } from '../services/gasApi'
import PageShell from './PageShell'
import { AlertToastHost } from './Alert'

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

export default function TransactionHistoryScreen({ onBack }: { onBack: () => void }) {
  const { outlet, kasirInfo } = useApp()
  const [transactions, setTransactions] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [selectedTx, setSelectedTx] = useState<any | null>(null)
  const [isVoiding, setIsVoiding] = useState(false)
  const [toasts, setToasts] = useState<{ id: string; variant: 'success' | 'destructive'; title: string; description?: string }[]>([])
  const addToast = (variant: 'success' | 'destructive', title: string, description?: string) =>
    setToasts(p => [...p, { id: Date.now().toString(), variant, title, description }])
  
  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    try {
      const rows = await getLocalTransactions()
      // Filter only today's transactions for this branch
      const today = new Date().toDateString()
      const filtered = rows.filter(r => {
        const payload = JSON.parse(r.payload || '{}')
        const isToday = new Date(r.timestamp).toDateString() === today
        return isToday && payload.branch_id === outlet.id
      })
      setTransactions(filtered)
    } catch (e) {
      console.error(e)
    }
  }

  const handleVoid = async (returnStock: boolean) => {
    if (!selectedTx) return
    setIsVoiding(true)
    try {
      const payload = {
        transaction_id: selectedTx.id,
        invoice_no: selectedTx.invoice_no,
        branch_id: outlet.id,
        cashier: kasirInfo?.name || 'Kasir',
        return_stock: returnStock,
        items: JSON.parse(selectedTx.payload).items || []
      }
      
      const res = await gasApi.postAction('voidTransaction', payload)
      if (res.status === 'success') {
        await updateLocalTransactionStatus(selectedTx.id, 'void')
        setSelectedTx(null)
        loadTransactions()
        addToast('success', 'Transaksi berhasil dibatalkan (Void).')
      } else {
        throw new Error(res.message || 'Unknown error')
      }
    } catch (err: any) {
      addToast('destructive', 'Gagal melakukan void', err.message || String(err))
    } finally {
      setIsVoiding(false)
    }
  }

  const filteredTx = transactions.filter(tx => 
    tx.invoice_no?.toLowerCase().includes(search.toLowerCase()) || 
    tx.id?.includes(search)
  )

  return (
    <>
    <PageShell 
      title="Riwayat Transaksi" 
      subtitle={`Hari Ini - Cabang ${outlet.name.replace('Hasuka Dimsum — ', '')}`}
      onBack={onBack}
      headerRight={
        <div className="relative w-64 hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Cari No. Invoice..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#8B4A1E]/20 focus:border-[#8B4A1E] outline-none"
          />
        </div>
      }
    >
      {/* Mobile search */}
      <div className="sm:hidden px-4 py-3 border-b" style={{ borderColor: '#E8D7C0', background: 'white' }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Cari No. Invoice..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#FAF6ED] border border-[#E8D7C0] rounded-xl text-sm outline-none"
          />
        </div>
      </div>
      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 custom-scrollbar">
        {filteredTx.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
            <ReceiptText size={48} opacity={0.5} />
            <p>Belum ada transaksi hari ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTx.map(tx => {
              const isVoid = tx.status === 'void'
              const payload = JSON.parse(tx.payload || '{}')
              const timeStr = new Date(tx.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
              return (
                <div 
                  key={tx.id} 
                  onClick={() => setSelectedTx(tx)}
                  className={`bg-white rounded-2xl p-5 border cursor-pointer transition-shadow hover:shadow-md ${isVoid ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 mb-0.5">{timeStr} WIB</p>
                      <p className="font-mono text-sm font-bold text-gray-800">{tx.invoice_no}</p>
                    </div>
                    {isVoid ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-lg flex items-center gap-1">
                        <Ban size={12} /> VOID
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-lg flex items-center gap-1">
                        <CheckCircle2 size={12} /> {payload.payment_method === 'QRIS' ? 'QRIS' : 'TUNAI'}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-100 border-dashed">
                    <p className="text-xs text-gray-500">{payload.items?.length || 0} Item</p>
                    <p className={`font-bold ${isVoid ? 'text-gray-400 line-through' : 'text-[#8B4A1E]'}`}>
                      {fmt(tx.total)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Detail / Void */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
            
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-serif font-bold text-xl text-gray-900">Detail Transaksi</h3>
                <span className={`px-2 py-1 text-[10px] font-bold rounded-lg ${selectedTx.status === 'void' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {selectedTx.status === 'void' ? 'DIBATALKAN' : 'SUKSES'}
                </span>
              </div>
              <p className="font-mono text-sm text-gray-500">{selectedTx.invoice_no}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(selectedTx.timestamp).toLocaleString('id-ID')}</p>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[40vh] custom-scrollbar">
              <div className="flex flex-col gap-3">
                {JSON.parse(selectedTx.payload).items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-bold text-gray-800">{item.product_name}</p>
                      <p className="text-xs text-gray-500">{item.qty} x {fmt(item.unit_price)}</p>
                    </div>
                    <p className="font-bold text-gray-800">{fmt(item.subtotal)}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100 border-dashed flex flex-col gap-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span><span>{fmt(selectedTx.subtotal)}</span>
                </div>
                {selectedTx.discount > 0 && (
                  <div className="flex justify-between text-sm text-orange-500">
                    <span>Diskon</span><span>-{fmt(selectedTx.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-500">
                  <span>PPN 11%</span><span>{fmt(selectedTx.tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-gray-900 mt-2">
                  <span>Total</span><span>{fmt(selectedTx.total)}</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col gap-3">
              {selectedTx.status !== 'void' && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl mb-2">
                  <p className="text-[11px] text-red-700 font-medium flex gap-2 items-start">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    Membatalkan (Void) transaksi akan mengubah laporan penjualan hari ini. Pilih apakah bahan baku dikembalikan ke stok atau dianggap rusak/hangus.
                  </p>
                </div>
              )}
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setSelectedTx(null)}
                  disabled={isVoiding}
                  className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl text-sm"
                >
                  Tutup
                </button>
                {selectedTx.status !== 'void' && (
                  <>
                    <button 
                      onClick={() => handleVoid(false)}
                      disabled={isVoiding}
                      className="flex-1 py-3 bg-orange-100 text-orange-700 font-bold rounded-xl text-sm opacity-90 hover:opacity-100 disabled:opacity-50"
                    >
                      {isVoiding ? 'Loading...' : 'Void (Stok Hangus)'}
                    </button>
                    <button 
                      onClick={() => handleVoid(true)}
                      disabled={isVoiding}
                      className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl text-sm hover:bg-red-700 disabled:opacity-50"
                    >
                      {isVoiding ? 'Loading...' : 'Void & Kembalikan'}
                    </button>
                  </>
                )}
              </div>
            </div>
            
          </div>
        </div>
      )}

    </PageShell>
    <AlertToastHost toasts={toasts} onDismiss={id => setToasts(p => p.filter(t => t.id !== id))} />
    </>
  )
}

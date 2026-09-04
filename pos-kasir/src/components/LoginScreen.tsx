import { useState } from 'react'
import { Delete, AlertTriangle, XCircle } from 'lucide-react'

const KASIR_LIST = [
  { id: '1', name: 'Rina', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026024d' },
  { id: '2', name: 'Budi', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
  { id: '3', name: 'Sari', avatarUrl: 'https://i.pravatar.cc/150?u=a04258114e29026702d' },
]

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [selectedKasir, setSelectedKasir] = useState(KASIR_LIST[0].id)
  const [pin, setPin] = useState('123')
  const [errorMsg, setErrorMsg] = useState('PIN salah, coba lagi')

  const handleKeyPress = (val: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + val)
      if (errorMsg) setErrorMsg('')
    }
  }

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1))
  }

  const handleClear = () => {
    setPin('')
  }

  return (
    <div className="bg-surface p-10 rounded-3xl w-[420px] flex flex-col items-center border border-borderLight shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 w-full justify-center">
        <div className="bg-primary text-white w-10 h-10 flex items-center justify-center rounded-[10px]">
          <XCircle size={24} strokeWidth={2} />
        </div>
        <div className="flex flex-col">
          <h1 className="text-[26px] font-serif font-bold text-textPrimary leading-none tracking-tight">
            WarungPOS
          </h1>
          <p className="text-textSecondary text-[10px] font-medium tracking-widest mt-1 uppercase">
            CABANG KEMANG
          </p>
        </div>
      </div>

      <div className="w-full h-px bg-borderLight mb-6"></div>

      {/* Select Kasir */}
      <div className="text-[11px] font-bold text-textSecondary tracking-wider mb-5 uppercase">
        PILIH KASIR YANG BERTUGAS
      </div>
      
      <div className="flex gap-2 mb-8">
        {KASIR_LIST.map((kasir) => {
          const isSelected = selectedKasir === kasir.id;
          return (
            <div 
              key={kasir.id} 
              className="cursor-pointer"
              onClick={() => setSelectedKasir(kasir.id)}
            >
              <div className={`flex flex-col items-center gap-2 py-3 px-4 rounded-xl border transition-all ${isSelected ? 'border-primary bg-[#FFFDFB]' : 'border-transparent'}`}>
                <div className="w-[52px] h-[52px] rounded-full overflow-hidden border border-borderLight">
                  <img src={kasir.avatarUrl} alt={kasir.name} className="w-full h-full object-cover" />
                </div>
                <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-textPrimary'}`}>
                  {kasir.name}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* PIN Indicator */}
      <div className="flex gap-3 mb-4 h-4 items-center">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i} 
            className={`w-[12px] h-[12px] rounded-full border-2 transition-colors ${i < pin.length ? 'bg-[#2D2926] border-[#2D2926]' : 'bg-transparent border-[#9A948C]'}`}
          />
        ))}
      </div>

      {/* Error Message Space */}
      <div className="h-6 mb-5 flex items-center justify-center w-full">
        {errorMsg && (
          <div className="flex items-center gap-1.5 text-danger">
            <AlertTriangle size={16} strokeWidth={2.5} />
            <span className="text-[13px] font-medium">
              {errorMsg}
            </span>
          </div>
        )}
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-3 w-full mb-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button 
            key={num}
            onClick={() => handleKeyPress(num.toString())}
            className="bg-white border border-borderLight hover:bg-gray-50 active:bg-gray-100 transition-colors py-4 rounded-lg text-2xl font-serif font-bold text-textPrimary"
          >
            {num}
          </button>
        ))}
        <button 
          onClick={handleClear}
          className="bg-keypadSpecial border border-borderLight hover:bg-gray-200 active:bg-gray-300 transition-colors py-4 rounded-lg text-xl font-serif font-bold text-textPrimary"
        >
          C
        </button>
        <button 
          onClick={() => handleKeyPress('0')}
          className="bg-white border border-borderLight hover:bg-gray-50 active:bg-gray-100 transition-colors py-4 rounded-lg text-2xl font-serif font-bold text-textPrimary"
        >
          0
        </button>
        <button 
          onClick={handleDelete}
          className="bg-keypadSpecial border border-borderLight hover:bg-gray-200 active:bg-gray-300 transition-colors py-4 rounded-lg text-textPrimary flex items-center justify-center"
        >
          <Delete size={24} strokeWidth={1.5} />
        </button>
      </div>

      {/* Action Buttons */}
      <button 
        onClick={onLogin}
        className="w-full bg-primary hover:bg-primaryHover text-white font-medium py-3.5 rounded-lg mb-5 transition-colors text-[15px]"
      >
        Masuk Tugas
      </button>
      
      <button className="text-primary font-medium hover:underline text-[13px]">
        Ganti Kasir
      </button>
    </div>
  )
}

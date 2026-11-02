import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  onBack?: () => void
}

interface State {
  hasError: boolean
}

export class SettingsErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Detail error teknis dicatat secara lengkap hanya di console browser
    console.error('[SettingsErrorBoundary] Terjadi kesalahan saat memuat Pengaturan:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen w-full flex items-center justify-center p-4 bg-[#FAF6ED]"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{`
            ::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div
            className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-white border border-[#E8D7C0] shadow-xl text-center space-y-5 animate-fade-in"
          >
            <div
              className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center"
              style={{ background: '#FFF1F0', border: '1.5px solid #FFA39E' }}
            >
              <AlertTriangle size={28} color="#CF1322" />
            </div>

            <div className="space-y-1.5">
              <h2 className="font-serif font-bold text-[18px] text-[#2B1810]">
                Pengaturan Sistem Mengalami Kendala
              </h2>
              <p className="text-[13px] text-[#6B5448] leading-relaxed">
                Halaman pengaturan sementara tidak dapat ditampilkan. Transaksi dan data kasir Anda tetap aman tersimpan.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
              {this.props.onBack && (
                <button
                  type="button"
                  onClick={this.props.onBack}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-[13px] text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:opacity-90 active:scale-95"
                  style={{ background: '#8B4A1E' }}
                >
                  <ArrowLeft size={16} />
                  Kembali ke Halaman Kasir
                </button>
              )}
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-semibold text-[13px] text-[#6B5448] flex items-center justify-center gap-2 border border-[#E8D7C0] hover:bg-[#FAF6ED] transition-all cursor-pointer active:scale-95"
              >
                <RefreshCw size={14} />
                Coba Lagi
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

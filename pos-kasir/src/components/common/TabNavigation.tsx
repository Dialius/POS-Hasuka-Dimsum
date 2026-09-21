import { LucideIcon } from 'lucide-react'

export interface Tab {
  id: string
  label: string
  icon?: LucideIcon
}

interface Props {
  tabs: Tab[]
  activeTab: string
  onTabChange: (id: string) => void
  variant?: 'pills' | 'underline' | 'sidebar'
  className?: string
}

export function TabNavigation({ tabs, activeTab, onTabChange, variant = 'pills', className = '' }: Props) {
  if (variant === 'sidebar') {
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors"
              style={{
                background: isActive ? '#2B1810' : 'transparent',
                color: isActive ? '#F3E7CE' : '#6B5448',
              }}
            >
              {Icon && <Icon size={15} />}
              <span className="font-semibold text-[13px]">{tab.label}</span>
            </button>
          )
        })}
      </div>
    )
  }

  if (variant === 'underline') {
    return (
      <div className={`flex gap-1 border-b ${className}`} style={{ borderColor: '#E8D7C0' }}>
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-bold transition-colors relative"
              style={{ color: isActive ? '#8B4A1E' : '#6B5448' }}
            >
              {Icon && <Icon size={14} />}
              {tab.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: '#8B4A1E' }} />
              )}
            </button>
          )
        })}
      </div>
    )
  }

  // pills (default)
  return (
    <div className={`flex gap-2 overflow-x-auto scrollbar-hide ${className}`}>
      {tabs.map(tab => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold whitespace-nowrap shrink-0 transition-colors"
            style={{ background: isActive ? '#2B1810' : '#F3E7CE', color: isActive ? '#F3E7CE' : '#6B5448' }}
          >
            {Icon && <Icon size={13} />}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

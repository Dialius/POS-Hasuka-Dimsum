import { ReactNode } from 'react'

interface Tab {
  id: string
  label: string
  content: ReactNode
}

interface Props {
  tabs: Tab[]
  activeTab: string
  onTabChange: (id: string) => void
}

export default function TabView({ tabs, activeTab, onTabChange }: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Tab headers */}
      <div className="flex gap-1 px-6 pt-4 overflow-x-auto" style={{ borderBottom: '2px solid #E8D7C0' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="px-4 py-2.5 text-[13px] font-bold whitespace-nowrap transition-colors rounded-t-xl"
            style={{
              background: activeTab === tab.id ? '#FAF6ED' : 'transparent',
              color: activeTab === tab.id ? '#8B4A1E' : '#6B5448',
              borderBottom: activeTab === tab.id ? '2px solid #8B4A1E' : '2px solid transparent',
              marginBottom: '-2px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5">
        {tabs.find(t => t.id === activeTab)?.content}
      </div>
    </div>
  )
}

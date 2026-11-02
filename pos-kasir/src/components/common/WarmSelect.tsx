import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface WarmSelectOption<T extends string | number> {
  value: T
  label: string
  badge?: string
  description?: string
}

export interface WarmSelectProps<T extends string | number> {
  value: T
  onChange: (val: T) => void
  options: WarmSelectOption<T>[]
  label?: string
  className?: string
  id?: string
}

export function WarmSelect<T extends string | number>({
  value,
  onChange,
  options,
  label,
  className = '',
  id,
}: WarmSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listboxRef = useRef<HTMLUListElement>(null)

  const selectedOption = options.find(o => o.value === value) || options[0]

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen])

  // Scroll otomatis ke item yang aktif saat dibuka
  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex(o => o.value === value)
      setFocusedIndex(idx >= 0 ? idx : 0)
    }
  }, [isOpen, value, options])

  // Navigasi keyboard
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => (prev < options.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : options.length - 1))
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (focusedIndex >= 0 && focusedIndex < options.length) {
          onChange(options[focusedIndex].value)
          setIsOpen(false)
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        break
      case 'Tab':
        setIsOpen(false)
        break
    }
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className="block text-[11px] font-bold mb-1.5"
          style={{ color: '#6B5448', letterSpacing: '0.06em' }}
        >
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen(prev => !prev)}
        onKeyDown={handleKeyDown}
        className="w-full px-4 py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-between transition-all outline-none"
        style={{
          background: '#F3E7CE',
          border: isOpen ? '1.5px solid #8B4A1E' : '1.5px solid #E8D7C0',
          boxShadow: isOpen ? '0 0 0 2px rgba(139, 74, 30, 0.15)' : 'none',
          color: '#2B1810',
        }}
      >
        <span className="flex items-center gap-2 truncate">
          <span className="truncate">{selectedOption?.label}</span>
          {selectedOption?.badge && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0"
              style={{ background: '#8B4A1E15', color: '#8B4A1E' }}
            >
              {selectedOption.badge}
            </span>
          )}
        </span>

        <ChevronDown
          size={16}
          className="shrink-0 ml-2 text-[#8B4A1E] transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Floating Options Panel */}
      <ul
        ref={listboxRef}
        role="listbox"
        aria-label={label || 'Pilihan'}
        className="absolute left-0 right-0 z-50 mt-1.5 py-1.5 rounded-2xl shadow-lg border overflow-y-auto"
        style={{
          background: '#FAF6ED',
          borderColor: '#E8D7C0',
          maxHeight: '240px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'translateY(0)' : 'translateY(-6px)',
          transition: 'opacity 160ms cubic-bezier(0.16, 1, 0.3, 1), transform 160ms cubic-bezier(0.16, 1, 0.3, 1)',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
        {options.map((opt, idx) => {
          const isSelected = opt.value === value
          const isFocused = idx === focusedIndex

          return (
            <li
              key={String(opt.value)}
              role="option"
              aria-selected={isSelected}
              onClick={() => {
                onChange(opt.value)
                setIsOpen(false)
              }}
              onMouseEnter={() => setFocusedIndex(idx)}
              className="px-4 py-2.5 cursor-pointer flex items-center justify-between text-[12px] transition-colors"
              style={{
                background: isFocused ? '#F3E7CE' : isSelected ? '#F3E7CE60' : 'transparent',
                color: isSelected ? '#8B4A1E' : '#2B1810',
                fontWeight: isSelected ? 700 : 500,
              }}
            >
              <div className="flex flex-col min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className="truncate">{opt.label}</span>
                  {opt.badge && (
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0"
                      style={{ background: '#8B4A1E15', color: '#8B4A1E' }}
                    >
                      {opt.badge}
                    </span>
                  )}
                </div>
                {opt.description && (
                  <span className="text-[10px] text-[#6B5448] mt-0.5 truncate">
                    {opt.description}
                  </span>
                )}
              </div>

              {isSelected && (
                <Check size={14} className="text-[#8B4A1E] shrink-0 ml-2" />
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

interface DropdownOption {
  value: string
  label: string
  icon?: string
}

interface DropdownProps {
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function Dropdown({ options, value, onChange, placeholder = 'Select...', className = '' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const selectedOption = options.find(opt => opt.value === value)
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-3 rounded-lg text-sm transition-all duration-200 bg-[#1A1A1A] border border-[#1A1A1A] text-[#E8E8E8] hover:border-[#252525]"
      >
        <span className="flex items-center gap-2">
          {selectedOption?.icon && <span>{selectedOption.icon}</span>}
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-[#505050] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="absolute left-0 right-0 top-full mt-1 py-1 rounded-lg z-50 overflow-hidden bg-[#1A1A1A] border border-[#252525] shadow-xl"
          >
            {options.map((option) => (
              <motion.button
                key={option.value}
                onClick={() => { onChange(option.value); setIsOpen(false) }}
                className={`w-full px-3 py-2 text-sm text-left transition-colors hover:bg-[#252525] flex items-center gap-2 ${
                  value === option.value ? 'text-[#E8E8E8] bg-[#252525]' : 'text-[#909090]'
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {option.icon && <span>{option.icon}</span>}
                {option.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

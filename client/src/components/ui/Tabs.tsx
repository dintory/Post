import { motion } from 'framer-motion'

export interface Tab {
  id: string
  label: string
  badge?: string
  icon?: React.ElementType
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (tabId: string) => void
  variant?: 'default' | 'pills' | 'underline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Tabs({ 
  tabs, 
  activeTab, 
  onChange, 
  variant = 'default',
  size = 'md',
  className = '' 
}: TabsProps) {
  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-sm'
  }

  const variantClasses = {
    default: 'bg-[#141414] rounded-xl border border-[#1A1A1A] p-1',
    pills: 'bg-transparent gap-1',
    underline: 'bg-transparent border-b border-[#1A1A1A] rounded-none'
  }

  return (
    <div className={`flex items-center ${variantClasses[variant]} ${className}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-2 ${sizeClasses[size]} rounded-lg font-medium transition-all duration-200 ${
              variant === 'underline' 
                ? isActive 
                  ? 'text-[#E8E8E8] border-b-2 border-[#10b981] -mb-[1px] rounded-none'
                  : 'text-[#909090] hover:text-[#E8E8E8] rounded-none'
                : isActive
                  ? 'text-[#E8E8E8]'
                  : 'text-[#909090] hover:text-[#E8E8E8]'
            }`}
          >
            {variant !== 'underline' && isActive && (
              <motion.div
                layoutId="activeTab"
                className={`absolute inset-0 ${variant === 'pills' ? 'bg-[#262626]' : 'bg-[#1A1A1A]'} rounded-lg`}
                transition={{ type: 'spring', duration: 0.5 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {Icon && <Icon className="w-4 h-4" />}
              {tab.label}
              {tab.badge && (
                <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  isActive 
                    ? 'bg-[#10b981]/20 text-[#10b981]' 
                    : 'bg-[#262626] text-[#909090]'
                }`}>
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}

import { motion } from 'framer-motion'

interface TrendChartProps {
  title: string
  value: string
  change: string
  positive: boolean
  data: number[]
  xLabel?: string
  yLabel?: string
  labels?: string[]
  className?: string
}

export function TrendChart({
  title,
  value,
  change,
  positive,
  data,
  xLabel = 'Time Period',
  yLabel = 'Value',
  labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  className = '',
}: TrendChartProps) {
  return (
    <div className={`rounded-xl p-4 bg-[#141414] border border-[#1A1A1A] ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-[#909090]">{title}</span>
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl font-semibold font-mono-nums text-[#E8E8E8]">{value}</span>
        <span
          className={`text-xs font-mono-nums ${
            positive ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {positive ? '+' : ''}
          {change}
        </span>
      </div>

      <span className="text-[10px] text-[#505050] block mb-3">{yLabel}</span>

      {/* Chart */}
      <div className="flex items-end gap-1 h-20">
        {data.map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            whileInView={{ height: `${h}%` }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="flex-1 bg-[#1A1A1A] hover:bg-[#10b981] transition-colors rounded-t cursor-pointer group relative"
          >
            {/* Tooltip */}
            <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-[10px] whitespace-nowrap transition-opacity pointer-events-none z-10">
              <span className="text-[#E8E8E8]">
                {h}% - {labels[i] || i + 1}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* X-axis */}
      <div className="flex justify-between mt-2 pt-2 border-t border-[#1A1A1A]">
        <span className="text-[10px] text-[#505050]">{labels[0]}</span>
        <span className="text-[10px] text-[#505050]">
          {labels[Math.floor((labels.length - 1) / 2)]}
        </span>
        <span className="text-[10px] text-[#505050]">
          {labels[Math.min(data.length - 1, labels.length - 1)]}
        </span>
      </div>
      <div className="text-center mt-1">
        <span className="text-[10px] text-[#505050]">{xLabel}</span>
      </div>
    </div>
  )
}

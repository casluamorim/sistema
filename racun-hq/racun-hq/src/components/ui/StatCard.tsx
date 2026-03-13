import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  color?: 'brand' | 'green' | 'red' | 'yellow' | 'blue'
  trend?: { value: number; label: string }
}

const colorMap = {
  brand: 'bg-brand-500/10 text-brand-400',
  green: 'bg-green-500/10 text-green-400',
  red: 'bg-red-500/10 text-red-400',
  yellow: 'bg-yellow-500/10 text-yellow-400',
  blue: 'bg-blue-500/10 text-blue-400',
}

export function StatCard({ title, value, subtitle, icon: Icon, color = 'brand', trend }: StatCardProps) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-gray-400 font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          {trend && (
            <p className={cn('text-xs mt-1.5 font-medium', trend.value >= 0 ? 'text-green-400' : 'text-red-400')}>
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', colorMap[color])}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  )
}

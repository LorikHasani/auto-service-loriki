import { classNames } from '../utils/helpers'

export const Card = ({ children, className = '' }) => {
  return (
    <div className={classNames(
      'bg-white rounded-xl border border-gray-200/80 shadow-sm p-4 sm:p-6 animate-slide-up',
      className
    )}>
      {children}
    </div>
  )
}

export const StatCard = ({ label, value, trend, icon: Icon, color = 'primary' }) => {
  const colors = {
    primary: { bg: 'bg-primary-50', text: 'text-primary-500', icon: 'bg-primary-400' },
    success: { bg: 'bg-green-50', text: 'text-green-600', icon: 'bg-green-500' },
    warning: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'bg-amber-500' },
    danger: { bg: 'bg-red-50', text: 'text-red-600', icon: 'bg-red-500' },
  }
  const c = colors[color]

  return (
    <div className={`${c.bg} rounded-xl border border-gray-100 p-3 sm:p-5 animate-slide-up`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">{label}</p>
          <p className={`text-lg sm:text-2xl font-bold mt-1 sm:mt-2 ${c.text} truncate`}>{value}</p>
          {trend && <p className="text-xs text-gray-500 mt-1">{trend}</p>}
        </div>
        {Icon && (
          <div className={`p-1.5 sm:p-2.5 ${c.icon} rounded-lg shadow-sm shrink-0`}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
        )}
      </div>
    </div>
  )
}

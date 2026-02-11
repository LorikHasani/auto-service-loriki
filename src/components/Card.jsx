import { classNames } from '../utils/helpers'

export const Card = ({ children, className = '' }) => {
  return (
    <div
      className={classNames(
        'bg-white rounded-xl border border-gray-200/80 shadow-sm p-6 animate-slide-up',
        className
      )}
    >
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
    <div className={`${c.bg} rounded-xl border border-gray-100 p-5 animate-slide-up`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {label}
          </p>
          <p className={`text-2xl font-bold mt-2 ${c.text}`}>{value}</p>
          {trend && (
            <p className="text-xs text-gray-500 mt-1">{trend}</p>
          )}
        </div>
        {Icon && (
          <div className={`p-2.5 ${c.icon} rounded-lg shadow-sm`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
    </div>
  )
}

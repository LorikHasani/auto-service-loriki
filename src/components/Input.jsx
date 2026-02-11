import { classNames } from '../utils/helpers'

export const Input = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          {label}
        </label>
      )}
      <input
        className={classNames(
          'w-full px-3.5 py-2.5 border border-gray-200 rounded-lg transition-all duration-150 text-sm',
          'focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100',
          'placeholder:text-gray-400',
          error && 'border-red-300 focus:border-red-400 focus:ring-red-100',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export const Select = ({
  label,
  error,
  children,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          {label}
        </label>
      )}
      <select
        className={classNames(
          'w-full px-3.5 py-2.5 border border-gray-200 rounded-lg transition-all duration-150 text-sm',
          'focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100',
          'bg-white',
          error && 'border-red-300 focus:border-red-400 focus:ring-red-100',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export const TextArea = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          {label}
        </label>
      )}
      <textarea
        className={classNames(
          'w-full px-3.5 py-2.5 border border-gray-200 rounded-lg transition-all duration-150 text-sm',
          'focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100',
          'placeholder:text-gray-400',
          error && 'border-red-300 focus:border-red-400 focus:ring-red-100',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

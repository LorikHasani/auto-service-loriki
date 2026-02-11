import { classNames } from '../utils/helpers'

const variants = {
  primary: 'bg-primary-400 hover:bg-primary-500 text-white shadow-sm',
  secondary: 'bg-dark-500 hover:bg-dark-600 text-white shadow-sm',
  success: 'bg-green-500 hover:bg-green-600 text-white shadow-sm',
  danger: 'bg-red-500 hover:bg-red-600 text-white shadow-sm',
  outline: 'border border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50',
}

const sizes = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}) => {
  return (
    <button
      className={classNames(
        'rounded-lg font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

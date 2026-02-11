import { classNames } from '../utils/helpers'

export const Table = ({ children, className = '' }) => {
  return (
    <div className="overflow-x-auto rounded-lg">
      <table className={classNames('w-full', className)}>{children}</table>
    </div>
  )
}

export const TableHeader = ({ children }) => {
  return (
    <thead>
      <tr className="border-b-2 border-gray-100">{children}</tr>
    </thead>
  )
}

export const TableHeaderCell = ({ children, className = '' }) => {
  return (
    <th
      className={classNames(
        'px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider',
        className
      )}
    >
      {children}
    </th>
  )
}

export const TableBody = ({ children }) => {
  return <tbody className="divide-y divide-gray-50">{children}</tbody>
}

export const TableRow = ({ children, className = '' }) => {
  return (
    <tr className={classNames('hover:bg-gray-50/50 transition-colors', className)}>
      {children}
    </tr>
  )
}

export const TableCell = ({ children, className = '' }) => {
  return (
    <td className={classNames('px-5 py-3.5 text-sm whitespace-nowrap', className)}>
      {children}
    </td>
  )
}

export const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    success: 'bg-green-50 text-green-700 ring-1 ring-green-600/20',
    danger: 'bg-red-50 text-red-700 ring-1 ring-red-600/20',
    warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
    info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
    default: 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20',
  }

  return (
    <span
      className={classNames(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold',
        variants[variant]
      )}
    >
      {children}
    </span>
  )
}

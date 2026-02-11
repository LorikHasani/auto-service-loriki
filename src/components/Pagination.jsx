import { ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 10

export const usePagination = (items, pageSize = PAGE_SIZE) => {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  return { totalPages, pageSize }
}

export const paginate = (items, page, pageSize = PAGE_SIZE) => {
  const start = (page - 1) * pageSize
  return items.slice(start, start + pageSize)
}

export const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, pageSize = PAGE_SIZE }) => {
  if (totalPages <= 1) return null

  const from = (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, totalItems)

  const getPages = () => {
    const pages = []
    const delta = 1
    const left = Math.max(2, currentPage - delta)
    const right = Math.min(totalPages - 1, currentPage + delta)

    pages.push(1)
    if (left > 2) pages.push('...')
    for (let i = left; i <= right; i++) pages.push(i)
    if (right < totalPages - 1) pages.push('...')
    if (totalPages > 1) pages.push(totalPages)

    return pages
  }

  return (
    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
      <p className="text-sm text-gray-500">
        Duke shfaqur <span className="font-medium text-gray-700">{from}</span>–<span className="font-medium text-gray-700">{to}</span> nga <span className="font-medium text-gray-700">{totalItems}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {getPages().map((page, i) =>
          page === '...' ? (
            <span key={'dots-' + i} className="px-1 text-gray-400 text-sm">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                page === currentPage
                  ? 'bg-primary-400 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

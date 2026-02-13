import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, Plus, X } from 'lucide-react'

export const SearchableSelect = ({ label, value, onChange, options, placeholder = 'Zgjidh...', onAdd, addLabel, required = false, displayValue }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus()
  }, [isOpen])

  const filtered = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  )

  const selectedLabel = displayValue || options.find(o => String(o.value) === String(value))?.label || ''

  return (
    <div ref={ref} className="relative">
      {label && <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>}
      <button type="button" onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2.5 border rounded-xl text-left flex items-center justify-between transition-all text-sm ${
          isOpen ? 'border-primary-400 ring-2 ring-primary-100' : 'border-gray-200 hover:border-gray-300'
        } ${!value ? 'text-gray-400' : 'text-gray-900'}`}>
        <span className="truncate">{selectedLabel || placeholder}</span>
        {value ? (
          <X className="w-4 h-4 text-gray-400 hover:text-gray-600 shrink-0" onClick={(e) => { e.stopPropagation(); onChange(''); setSearch('') }} />
        ) : (
          <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input ref={inputRef} type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Kërko..." className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400" />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">Asnjë rezultat</div>
            ) : (
              filtered.map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => { onChange(String(opt.value)); setIsOpen(false); setSearch('') }}
                  className={`w-full px-3 py-2.5 text-left text-sm hover:bg-primary-50 transition-colors ${
                    String(opt.value) === String(value) ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-700'
                  }`}>
                  {opt.label}
                  {opt.sub && <span className="block text-xs text-gray-400">{opt.sub}</span>}
                </button>
              ))
            )}
          </div>
          {onAdd && (
            <button type="button" onClick={() => { setIsOpen(false); setSearch(''); onAdd() }}
              className="w-full px-3 py-2.5 text-left text-sm text-primary-600 font-medium hover:bg-primary-50 border-t border-gray-100 flex items-center gap-2">
              <Plus className="w-4 h-4" /> {addLabel || 'Shto të ri'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

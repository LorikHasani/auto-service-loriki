import { useState, useMemo, useEffect } from 'react'
import { Plus, Trash2, Edit2, Calendar, X, Receipt, Fuel, UtensilsCrossed, Package2, Tag } from 'lucide-react'
import { Card, StatCard } from '../components/Card'
import { Button } from '../components/Button'
import { Input, Select, TextArea } from '../components/Input'
import { Modal } from '../components/Modal'
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/Table'
import { Loading, EmptyState } from '../components/Loading'
import { Pagination, paginate, usePagination } from '../components/Pagination'
import { useExpenses } from '../hooks/useData'
import { formatCurrency, formatDate } from '../utils/helpers'
import { supabase } from '../services/supabase'

const CATEGORIES = [
  { value: 'Naftë', icon: Fuel },
  { value: 'Ushqim', icon: UtensilsCrossed },
  { value: 'Furnizime', icon: Package2 },
  { value: 'Tjera', icon: Tag },
]

const todayISO = () => {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

export const Expenses = () => {
  const { expenses, loading, refetch } = useExpenses()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({ expense_date: todayISO(), category: 'Naftë', description: '', amount: '' })
  const [submitting, setSubmitting] = useState(false)
  const [page, setPage] = useState(1)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const filtered = useMemo(() => {
    let result = expenses
    if (dateFrom) result = result.filter(e => e.expense_date >= dateFrom)
    if (dateTo) result = result.filter(e => e.expense_date <= dateTo)
    if (categoryFilter !== 'all') result = result.filter(e => e.category === categoryFilter)
    return result
  }, [expenses, dateFrom, dateTo, categoryFilter])

  useEffect(() => { setPage(1) }, [dateFrom, dateTo, categoryFilter])

  const total = useMemo(() => filtered.reduce((s, e) => s + parseFloat(e.amount || 0), 0), [filtered])

  const byCategory = useMemo(() => {
    const map = {}
    filtered.forEach(e => { map[e.category] = (map[e.category] || 0) + parseFloat(e.amount || 0) })
    return map
  }, [filtered])

  const { totalPages } = usePagination(filtered)
  const paginated = paginate(filtered, page)

  const handleOpenModal = (expense = null) => {
    if (expense) {
      setEditing(expense)
      setFormData({
        expense_date: expense.expense_date,
        category: expense.category,
        description: expense.description || '',
        amount: String(expense.amount)
      })
    } else {
      setEditing(null)
      setFormData({ expense_date: todayISO(), category: 'Naftë', description: '', amount: '' })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        expense_date: formData.expense_date,
        category: formData.category,
        description: formData.description.trim() || null,
        amount: parseFloat(formData.amount) || 0
      }
      if (editing) {
        const { error } = await supabase.from('daily_expenses').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('daily_expenses').insert([payload])
        if (error) throw error
      }
      setIsModalOpen(false)
      refetch()
    } catch (error) { alert('Gabim: ' + error.message) }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Fshi këtë shpenzim?')) return
    try {
      const { error } = await supabase.from('daily_expenses').delete().eq('id', id)
      if (error) throw error
      refetch()
    } catch (error) { alert('Gabim: ' + error.message) }
  }

  const hasFilters = dateFrom || dateTo || categoryFilter !== 'all'
  const clearFilters = () => { setDateFrom(''); setDateTo(''); setCategoryFilter('all') }

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-4xl font-display text-dark-500 mb-2">Shpenzimet</h1>
          <p className="text-gray-600">Regjistro shpenzimet ditore (naftë, ushqim, etj.)</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2"><Plus className="w-5 h-5" /> Shto Shpenzim</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard label="Totali" value={formatCurrency(total)} icon={Receipt} color="danger" />
        {CATEGORIES.map(c => (
          <StatCard key={c.value} label={c.value} value={formatCurrency(byCategory[c.value] || 0)} icon={c.icon} color="warning" />
        ))}
      </div>

      <Card className="!p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600"><Calendar className="w-4 h-4" /> Filtro:</div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Nga</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Deri</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Kategoria</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all text-sm bg-white">
              <option value="all">Të gjitha</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
            </select>
          </div>
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="flex items-center gap-1 h-[38px]">
              <X className="w-4 h-4" /> Pastro
            </Button>
          )}
          <span className="text-sm text-gray-500 ml-2">{filtered.length} shpenzime</span>
        </div>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState title={hasFilters ? "Asnjë shpenzim në këto filtra" : "Nuk ka shpenzime ende"} description={hasFilters ? "Provo të ndryshosh filtrat" : "Shto shpenzimin e parë për të nisur"}
            action={!hasFilters && <Button onClick={() => handleOpenModal()}><Plus className="w-5 h-5 mr-2" />Shto Shpenzim</Button>} />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableHeaderCell>Data</TableHeaderCell>
                <TableHeaderCell>Kategoria</TableHeaderCell>
                <TableHeaderCell>Përshkrimi</TableHeaderCell>
                <TableHeaderCell>Shuma</TableHeaderCell>
                <TableHeaderCell>Veprime</TableHeaderCell>
              </TableHeader>
              <TableBody>
                {paginated.map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell><span className="text-sm text-gray-600">{formatDate(exp.expense_date + 'T12:00:00')}</span></TableCell>
                    <TableCell><span className="font-medium text-dark-500">{exp.category}</span></TableCell>
                    <TableCell><span className="text-sm text-gray-600">{exp.description || '—'}</span></TableCell>
                    <TableCell><span className="font-semibold text-red-600">{formatCurrency(parseFloat(exp.amount))}</span></TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenModal(exp)} className="p-1.5 hover:bg-gray-100 rounded"><Edit2 className="w-4 h-4 text-gray-600" /></button>
                        <button onClick={() => handleDelete(exp.id)} className="p-1.5 hover:bg-red-100 rounded"><Trash2 className="w-4 h-4 text-red-600" /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} />
          </>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Ndrysho Shpenzimin' : 'Shto Shpenzim'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Data" type="date" value={formData.expense_date} onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })} required />
          <Select label="Kategoria" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
          </Select>
          <Input label="Shuma (€)" type="number" step="0.01" min="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" required />
          <TextArea label="Përshkrimi (opsional)" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="p.sh., Naftë për veturën e servisit" rows={3} />
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Anulo</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Duke ruajtur...' : editing ? 'Përditëso' : 'Shto'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

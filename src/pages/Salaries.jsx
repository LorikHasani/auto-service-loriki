import { useState, useMemo, useEffect } from 'react'
import { Plus, Trash2, Edit2, Calendar, X, Wallet, User } from 'lucide-react'
import { Card, StatCard } from '../components/Card'
import { Button } from '../components/Button'
import { Input, Select, TextArea } from '../components/Input'
import { Modal } from '../components/Modal'
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/Table'
import { Loading, EmptyState } from '../components/Loading'
import { Pagination, paginate, usePagination } from '../components/Pagination'
import { useSalaries, useEmployees } from '../hooks/useData'
import { formatCurrency, formatDate } from '../utils/helpers'
import { supabase } from '../services/supabase'

const todayISO = () => {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

export const Salaries = () => {
  const { salaries, loading, refetch } = useSalaries()
  const { employees, loading: empLoading } = useEmployees()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({ payment_date: todayISO(), employee_id: '', amount: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [page, setPage] = useState(1)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [employeeFilter, setEmployeeFilter] = useState('all')

  const filtered = useMemo(() => {
    let result = salaries
    if (dateFrom) result = result.filter(s => s.payment_date >= dateFrom)
    if (dateTo) result = result.filter(s => s.payment_date <= dateTo)
    if (employeeFilter !== 'all') result = result.filter(s => String(s.employee_id) === String(employeeFilter))
    return result
  }, [salaries, dateFrom, dateTo, employeeFilter])

  useEffect(() => { setPage(1) }, [dateFrom, dateTo, employeeFilter])

  const total = useMemo(() => filtered.reduce((s, p) => s + parseFloat(p.amount || 0), 0), [filtered])

  const byEmployee = useMemo(() => {
    const map = {}
    filtered.forEach(p => {
      const name = p.employees?.name || 'N/A'
      map[name] = (map[name] || 0) + parseFloat(p.amount || 0)
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [filtered])

  const { totalPages } = usePagination(filtered)
  const paginated = paginate(filtered, page)

  const handleOpenModal = (sal = null) => {
    if (sal) {
      setEditing(sal)
      setFormData({
        payment_date: sal.payment_date,
        employee_id: String(sal.employee_id),
        amount: String(sal.amount),
        notes: sal.notes || ''
      })
    } else {
      setEditing(null)
      setFormData({ payment_date: todayISO(), employee_id: employees[0] ? String(employees[0].id) : '', amount: '', notes: '' })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.employee_id) { alert('Zgjidh një punonjës'); return }
    setSubmitting(true)
    try {
      const payload = {
        payment_date: formData.payment_date,
        employee_id: parseInt(formData.employee_id, 10),
        amount: parseFloat(formData.amount) || 0,
        notes: formData.notes.trim() || null
      }
      if (editing) {
        const { error } = await supabase.from('salary_payments').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('salary_payments').insert([payload])
        if (error) throw error
      }
      setIsModalOpen(false)
      refetch()
    } catch (error) { alert('Gabim: ' + error.message) }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Fshi këtë pagesë rroge?')) return
    try {
      const { error } = await supabase.from('salary_payments').delete().eq('id', id)
      if (error) throw error
      refetch()
    } catch (error) { alert('Gabim: ' + error.message) }
  }

  const hasFilters = dateFrom || dateTo || employeeFilter !== 'all'
  const clearFilters = () => { setDateFrom(''); setDateTo(''); setEmployeeFilter('all') }

  if (loading || empLoading) return <Loading />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-4xl font-display text-dark-500 mb-2">Rrogat</h1>
          <p className="text-gray-600">Regjistro pagesat e rrogave për punonjësit</p>
        </div>
        <Button onClick={() => handleOpenModal()} disabled={employees.length === 0} className="flex items-center gap-2">
          <Plus className="w-5 h-5" /> Shto Pagesë
        </Button>
      </div>

      {employees.length === 0 && (
        <Card className="!p-4 bg-amber-50 border-amber-200">
          <p className="text-sm text-amber-800">Duhet të shtosh së paku një punonjës para se të regjistrosh rroga. Shko te <strong>Punonjësit</strong>.</p>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard label="Totali" value={formatCurrency(total)} icon={Wallet} color="primary" />
        <StatCard label="Pagesa" value={filtered.length} icon={Calendar} color="success" />
        <StatCard label="Punonjës" value={byEmployee.length} icon={User} color="warning" />
      </div>

      {byEmployee.length > 0 && (
        <Card className="!p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Përmbledhje për punonjës</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {byEmployee.map(([name, amount]) => (
              <div key={name} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="font-medium text-dark-500">{name}</span>
                <span className="font-bold text-primary-600">{formatCurrency(amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

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
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Punonjësi</label>
            <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all text-sm bg-white">
              <option value="all">Të gjithë</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>
          </div>
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="flex items-center gap-1 h-[38px]">
              <X className="w-4 h-4" /> Pastro
            </Button>
          )}
          <span className="text-sm text-gray-500 ml-2">{filtered.length} pagesa</span>
        </div>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState title={hasFilters ? "Asnjë pagesë në këto filtra" : "Nuk ka pagesa rroge ende"} description={hasFilters ? "Provo të ndryshosh filtrat" : "Regjistro pagesën e parë për të nisur"}
            action={!hasFilters && employees.length > 0 && <Button onClick={() => handleOpenModal()}><Plus className="w-5 h-5 mr-2" />Shto Pagesë</Button>} />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableHeaderCell>Data</TableHeaderCell>
                <TableHeaderCell>Punonjësi</TableHeaderCell>
                <TableHeaderCell>Shuma</TableHeaderCell>
                <TableHeaderCell>Shënim</TableHeaderCell>
                <TableHeaderCell>Veprime</TableHeaderCell>
              </TableHeader>
              <TableBody>
                {paginated.map((sal) => (
                  <TableRow key={sal.id}>
                    <TableCell><span className="text-sm text-gray-600">{formatDate(sal.payment_date + 'T12:00:00')}</span></TableCell>
                    <TableCell><span className="font-medium text-dark-500">{sal.employees?.name || 'N/A'}</span></TableCell>
                    <TableCell><span className="font-semibold text-primary-600">{formatCurrency(parseFloat(sal.amount))}</span></TableCell>
                    <TableCell><span className="text-sm text-gray-600">{sal.notes || '—'}</span></TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenModal(sal)} className="p-1.5 hover:bg-gray-100 rounded"><Edit2 className="w-4 h-4 text-gray-600" /></button>
                        <button onClick={() => handleDelete(sal.id)} className="p-1.5 hover:bg-red-100 rounded"><Trash2 className="w-4 h-4 text-red-600" /></button>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Ndrysho Pagesën' : 'Shto Pagesë Rroge'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Punonjësi" value={formData.employee_id} onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })} required>
            <option value="">— Zgjidh —</option>
            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
          </Select>
          <Input label="Data" type="date" value={formData.payment_date} onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })} required />
          <Input label="Shuma (€)" type="number" step="0.01" min="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" required />
          <TextArea label="Shënim (opsional)" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="p.sh., Rroga e marsit" rows={3} />
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Anulo</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Duke ruajtur...' : editing ? 'Përditëso' : 'Shto'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

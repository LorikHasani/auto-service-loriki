import { useState, useMemo, useEffect } from 'react'
import { Plus, Trash2, Printer, Search, X } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Input, TextArea } from '../components/Input'
import { Modal } from '../components/Modal'
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell, Badge } from '../components/Table'
import { Loading, EmptyState } from '../components/Loading'
import { Pagination, paginate, usePagination } from '../components/Pagination'
import { useLogs, useOrders } from '../hooks/useData'
import { formatDate, formatCurrency, calculateOrderTotal } from '../utils/helpers'
import { printOrderDocument } from '../utils/printOrder'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'

export const Logs = () => {
  const { logs, loading, refetch } = useLogs()
  const { user } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({ log_date: new Date().toISOString().split('T')[0], description: '' })
  const [submitting, setSubmitting] = useState(false)
  const [page, setPage] = useState(1)

  const { totalPages } = usePagination(logs)
  const paginatedLogs = paginate(logs, page)

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      const { error } = await supabase.from('daily_logs').insert([{ ...formData, staff_email: user.email }])
      if (error) throw error; setIsModalOpen(false); setFormData({ log_date: new Date().toISOString().split('T')[0], description: '' }); refetch()
    } catch (error) { alert('Gabim: ' + error.message) }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Fshi këtë regjistrim?')) return
    try { const { error } = await supabase.from('daily_logs').delete().eq('id', id); if (error) throw error; refetch() }
    catch (error) { alert('Gabim: ' + error.message) }
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display text-dark-500 mb-2">Regjistri Ditor</h1>
          <p className="text-gray-600">Regjistro aktivitetet ditore operacionale</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2"><Plus className="w-5 h-5" /> Shto Regjistrim</Button>
      </div>
      <Card>
        {logs.length === 0 ? (
          <EmptyState title="Nuk ka regjistrime ende" description="Fillo duke regjistruar aktivitetet ditore"
            action={<Button onClick={() => setIsModalOpen(true)}><Plus className="w-5 h-5 mr-2" />Shto Regjistrimin e Parë</Button>} />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableHeaderCell>Data</TableHeaderCell>
                <TableHeaderCell>Përshkrimi</TableHeaderCell>
                <TableHeaderCell>Stafi</TableHeaderCell>
                <TableHeaderCell>Veprime</TableHeaderCell>
              </TableHeader>
              <TableBody>
                {paginatedLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell><span className="font-medium">{formatDate(log.log_date)}</span></TableCell>
                    <TableCell>{log.description}</TableCell>
                    <TableCell><span className="text-sm text-gray-600">{log.staff_email}</span></TableCell>
                    <TableCell><Button variant="danger" size="sm" onClick={() => handleDelete(log.id)}><Trash2 className="w-4 h-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={logs.length} />
          </>
        )}
      </Card>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Shto Regjistrim Ditor">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Data" type="date" value={formData.log_date} onChange={(e) => setFormData({ ...formData, log_date: e.target.value })} required />
          <TextArea label="Përshkrimi" rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Anulo</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Duke shtuar...' : 'Shto Regjistrimin'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export const Invoices = () => {
  const { orders, loading } = useOrders()
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)

  const filteredOrders = useMemo(() => {
    let result = orders
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(o => (o.clients?.full_name||'').toLowerCase().includes(q) || (o.cars?.license_plate||'').toLowerCase().includes(q) || (o.cars?.vin||'').toLowerCase().includes(q))
    }
    if (dateFrom) { const f = new Date(dateFrom); f.setHours(0,0,0,0); result = result.filter(o => new Date(o.created_at) >= f) }
    if (dateTo) { const t = new Date(dateTo); t.setHours(23,59,59,999); result = result.filter(o => new Date(o.created_at) <= t) }
    return result
  }, [orders, searchQuery, dateFrom, dateTo])

  useEffect(() => { setPage(1) }, [searchQuery, dateFrom, dateTo])

  const { totalPages } = usePagination(filteredOrders)
  const paginatedOrders = paginate(filteredOrders, page)

  const clearFilters = () => { setSearchQuery(''); setDateFrom(''); setDateTo('') }
  const hasFilters = searchQuery || dateFrom || dateTo

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-display text-dark-500 mb-2">Faturat</h1>
        <p className="text-gray-600">Shiko dhe printo faturat e klientëve</p>
      </div>

      <Card className="!p-4">
        <div className="flex flex-col lg:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Kërko</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Kërko sipas emrit, targës ose VIN..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all text-sm" />
            </div>
          </div>
          <div className="flex gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nga</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Deri</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all text-sm" />
            </div>
            {hasFilters && <Button variant="outline" size="sm" onClick={clearFilters} className="flex items-center gap-1 h-[42px]"><X className="w-4 h-4" /> Pastro</Button>}
          </div>
        </div>
        {hasFilters && <div className="mt-3 text-sm text-gray-500">Duke shfaqur {filteredOrders.length} nga {orders.length} fatura</div>}
      </Card>

      <Card>
        {filteredOrders.length === 0 ? (
          <EmptyState title={hasFilters ? "Asnjë faturë nuk përputhet" : "Nuk ka fatura ende"} description={hasFilters ? "Provo të ndryshosh kërkimin ose datën" : "Faturat krijohen nga porositë"} />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableHeaderCell>Fatura #</TableHeaderCell>
                <TableHeaderCell>Klienti</TableHeaderCell>
                <TableHeaderCell>Automjeti</TableHeaderCell>
                <TableHeaderCell>VIN</TableHeaderCell>
                <TableHeaderCell>Data</TableHeaderCell>
                <TableHeaderCell>Shuma</TableHeaderCell>
                <TableHeaderCell>Statusi</TableHeaderCell>
                <TableHeaderCell>Veprime</TableHeaderCell>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell><span className="font-mono font-semibold text-primary-500">FAT-{order.id}</span></TableCell>
                    <TableCell><span className="font-medium">{order.clients?.full_name}</span></TableCell>
                    <TableCell>
                      <span className="text-sm">{order.cars?.make} {order.cars?.model}<span className="block text-xs text-gray-500">{order.cars?.license_plate}</span></span>
                    </TableCell>
                    <TableCell><span className="text-xs font-mono text-gray-500">{order.cars?.vin || '\u2014'}</span></TableCell>
                    <TableCell><span className="text-sm text-gray-600">{formatDate(order.created_at)}</span></TableCell>
                    <TableCell><span className="font-semibold">{formatCurrency(calculateOrderTotal(order))}</span></TableCell>
                    <TableCell><Badge variant={order.is_paid ? 'success' : 'danger'}>{order.is_paid ? 'Paguar' : 'Pa paguar'}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => printOrderDocument(order, { showPrices: true, showOrderNo: true })} title="Printo me çmime">
                          <Printer className="w-4 h-4 mr-1" /> Faturë
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => printOrderDocument(order, { showPrices: false, showOrderNo: false })} title="Printo pa çmime">
                          <Printer className="w-4 h-4 mr-1" /> Raport
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={filteredOrders.length} />
          </>
        )}
      </Card>
    </div>
  )
}

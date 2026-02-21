import { useState, useMemo, useEffect } from 'react'
import { Printer, RotateCcw, Search, Calendar, X } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell, Badge } from '../components/Table'
import { Loading, EmptyState } from '../components/Loading'
import { Pagination, paginate, usePagination } from '../components/Pagination'
import { useOrders } from '../hooks/useData'
import { formatCurrency, calculateOrderTotal, formatDate } from '../utils/helpers'
import { printOrderDocument } from '../utils/printOrder'
import { supabase } from '../services/supabase'

const getLocalDate = (ts) => {
  const d = new Date(ts)
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

export const Archive = () => {
  const { orders, loading, refetch } = useOrders(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)

  const archivedOrders = useMemo(() => {
    let result = orders.filter(o => o.is_archived === true)

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(o =>
        (o.clients?.full_name || '').toLowerCase().includes(q) ||
        (o.cars?.make || '').toLowerCase().includes(q) ||
        (o.cars?.model || '').toLowerCase().includes(q) ||
        (o.cars?.license_plate || '').toLowerCase().includes(q)
      )
    }
    if (dateFrom) result = result.filter(o => getLocalDate(o.created_at) >= dateFrom)
    if (dateTo) result = result.filter(o => getLocalDate(o.created_at) <= dateTo)

    return result
  }, [orders, searchQuery, dateFrom, dateTo])

  useEffect(() => { setPage(1) }, [searchQuery, dateFrom, dateTo])

  const { totalPages } = usePagination(archivedOrders)
  const paginatedOrders = paginate(archivedOrders, page)

  const hasFilters = searchQuery || dateFrom || dateTo
  const clearFilters = () => { setSearchQuery(''); setDateFrom(''); setDateTo('') }

  const unarchiveOrder = async (id) => {
    if (!confirm('Kthe këtë porosi në servisimet aktive?')) return
    try { const { error } = await supabase.from('orders').update({ is_archived: false, archived_at: null }).eq('id', id); if (error) throw error; refetch() }
    catch (error) { alert('Gabim: ' + error.message) }
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-4xl font-display text-dark-500 mb-2">Arkiva</h1>
        <p className="text-gray-600">Shiko dhe menaxho servisimet e arkivuara</p>
      </div>

      <Card className="!p-4">
        <div className="flex flex-col lg:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Kërko</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Kërko sipas emrit, automjetit ose targës..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
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
        {hasFilters && <div className="mt-3 text-sm text-gray-500">Duke shfaqur {archivedOrders.length} servisime të arkivuara</div>}
      </Card>

      <Card>
        {archivedOrders.length === 0 ? (
          <EmptyState title={hasFilters ? "Asnjë rezultat" : "Nuk ka servisime të arkivuara"} description={hasFilters ? "Provo filtër tjetër" : "Servisimet e ditëve të kaluara arkivohen automatikisht"} />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableHeaderCell>ID</TableHeaderCell>
                <TableHeaderCell>Klienti</TableHeaderCell>
                <TableHeaderCell>Automjeti</TableHeaderCell>
                <TableHeaderCell>Shërbimet</TableHeaderCell>
                <TableHeaderCell>Totali</TableHeaderCell>
                <TableHeaderCell>Statusi</TableHeaderCell>
                <TableHeaderCell>Krijuar</TableHeaderCell>
                <TableHeaderCell>Veprime</TableHeaderCell>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell><span className="font-mono font-semibold">#{order.id}</span></TableCell>
                    <TableCell><span className="font-medium">{order.clients?.full_name}</span></TableCell>
                    <TableCell>
                      <span className="text-sm">{order.cars?.make} {order.cars?.model}
                        <span className="block text-xs text-gray-400">{order.cars?.license_plate}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">{order.order_items?.map((item, idx) => <div key={idx}>• {item.service_name}</div>)}</div>
                    </TableCell>
                    <TableCell><span className="font-semibold">{formatCurrency(calculateOrderTotal(order))}</span></TableCell>
                    <TableCell><Badge variant={order.is_paid ? 'success' : 'danger'}>{order.is_paid ? 'Paguar' : 'Pa paguar'}</Badge></TableCell>
                    <TableCell><span className="text-sm text-gray-600">{formatDate(order.created_at)}</span></TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => unarchiveOrder(order.id)} title="Kthe në aktive"><RotateCcw className="w-4 h-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => printOrderDocument(order, { showPrices: true, showOrderNo: true })}><Printer className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={archivedOrders.length} />
          </>
        )}
      </Card>
    </div>
  )
}

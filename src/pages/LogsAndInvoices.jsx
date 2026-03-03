import { useState, useMemo, useEffect, useRef } from 'react'
import { Printer, Search, X, Calendar, Eye } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Modal } from '../components/Modal'
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell, Badge } from '../components/Table'
import { Loading, EmptyState } from '../components/Loading'
import { Pagination, paginate, usePagination } from '../components/Pagination'
import { useLogs, useOrders } from '../hooks/useData'
import { formatDate, formatCurrency, calculateOrderTotal } from '../utils/helpers'
import { printOrderDocument, printDailyReport } from '../utils/printOrder'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'

const getLocalDate = (timestamp) => {
  const d = new Date(timestamp)
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

const DAYS_SQ = ['E Diel', 'E Hënë', 'E Martë', 'E Mërkurë', 'E Enjte', 'E Premte', 'E Shtunë']
const AUTO_TAG = '[RAPORT-AUTO]'

const todayISO = () => {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

export const Logs = () => {
  const { orders, loading: ordersLoading } = useOrders(true)
  const { logs, loading: logsLoading, refetch: refetchLogs } = useLogs()
  const { user } = useAuth()
  const autoSaveRan = useRef(false)
  const [page, setPage] = useState(1)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [viewReport, setViewReport] = useState(null)
  const [viewOrders, setViewOrders] = useState([])

  // Auto-save missing past-day reports
  useEffect(() => {
    if (ordersLoading || logsLoading || autoSaveRan.current || !orders.length) return
    autoSaveRan.current = true

    const saveMissing = async () => {
      // Get all dates that have orders (except today)
      const today = todayISO()
      const ordersByDate = {}
      orders.forEach(o => {
        const d = getLocalDate(o.created_at)
        if (d < today) {
          if (!ordersByDate[d]) ordersByDate[d] = []
          ordersByDate[d].push(o)
        }
      })

      // Get dates that already have auto-reports
      const savedDates = new Set(
        logs.filter(l => l.description && l.description.startsWith(AUTO_TAG)).map(l => l.log_date)
      )

      // Save missing
      const toInsert = []
      for (const [dateStr, dayOrders] of Object.entries(ordersByDate)) {
        if (savedDates.has(dateStr)) continue
        const rev = dayOrders.reduce((s, o) => s + (o.order_items || []).reduce((ss, i) => ss + (i.quantity * i.unit_price), 0), 0)
        const cogs = dayOrders.reduce((s, o) => s + (o.order_items || []).reduce((ss, i) => ss + (parseFloat(i.parts_cost) || 0), 0), 0)
        const paid = dayOrders.filter(o => o.is_paid).length
        toInsert.push({
          log_date: dateStr,
          description: `${AUTO_TAG} Porosi: ${dayOrders.length} | Paguar: ${paid}/${dayOrders.length} | Të ardhura: ${formatCurrency(rev)} | Fitimi: ${formatCurrency(rev - cogs)}`,
          staff_email: user?.email || 'system'
        })
      }

      if (toInsert.length > 0) {
        await supabase.from('daily_logs').insert(toInsert)
        refetchLogs()
      }
    }
    saveMissing()
  }, [ordersLoading, logsLoading, orders, logs, user, refetchLogs])

  // Build report list from saved logs (auto-tagged)
  const reports = useMemo(() => {
    return logs
      .filter(l => l.description && l.description.startsWith(AUTO_TAG))
      .map(l => {
        const dateObj = new Date(l.log_date + 'T12:00:00')
        return {
          id: l.id,
          date: l.log_date,
          dateObj,
          dayName: DAYS_SQ[dateObj.getDay()],
          summary: l.description.replace(AUTO_TAG + ' ', '')
        }
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [logs])

  const filteredReports = useMemo(() => {
    let result = reports
    if (dateFrom) result = result.filter(r => r.date >= dateFrom)
    if (dateTo) result = result.filter(r => r.date <= dateTo)
    return result
  }, [reports, dateFrom, dateTo])

  useEffect(() => { setPage(1) }, [dateFrom, dateTo])

  const { totalPages } = usePagination(filteredReports)
  const paginatedReports = paginate(filteredReports, page)

  const hasFilters = dateFrom || dateTo
  const clearFilters = () => { setDateFrom(''); setDateTo('') }

  const handlePrint = (report) => {
    const dayOrders = orders.filter(o => getLocalDate(o.created_at) === report.date)
    printDailyReport(dayOrders, report.dayName + ' — ' + formatDate(report.dateObj))
  }

  const handleView = (report) => {
    const dayOrders = orders.filter(o => getLocalDate(o.created_at) === report.date)
    setViewReport(report)
    setViewOrders(dayOrders)
    setIsViewModalOpen(true)
  }

  if (ordersLoading || logsLoading) return <Loading />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-4xl font-display text-dark-500 mb-2">Raportet Ditore</h1>
        <p className="text-gray-600">Raportet ruhen automatikisht për çdo ditë me porosi</p>
      </div>

      <Card className="!p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600"><Calendar className="w-4 h-4" /> Filtro sipas datës:</div>
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
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="flex items-center gap-1 h-[38px]">
              <X className="w-4 h-4" /> Pastro
            </Button>
          )}
          <span className="text-sm text-gray-500 ml-2">{filteredReports.length} raporte</span>
        </div>
      </Card>

      <Card>
        {filteredReports.length === 0 ? (
          <EmptyState title={hasFilters ? "Asnjë raport në këtë interval" : "Nuk ka raporte ende"} description={hasFilters ? "Provo datë tjetër" : "Raportet krijohen automatikisht kur kalon dita"} />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableHeaderCell>Data</TableHeaderCell>
                <TableHeaderCell>Dita</TableHeaderCell>
                <TableHeaderCell>Përmbledhje</TableHeaderCell>
                <TableHeaderCell>Veprime</TableHeaderCell>
              </TableHeader>
              <TableBody>
                {paginatedReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{formatDate(report.dateObj)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-primary-600">{report.dayName}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{report.summary}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => handleView(report)} title="Shiko raportin">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => handlePrint(report)} title="Printo">
                          <Printer className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={filteredReports.length} />
          </>
        )}
      </Card>

      {/* View Report Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={viewReport ? 'Raporti — ' + viewReport.dayName + ' ' + formatDate(viewReport.dateObj) : ''} size="lg">
        {viewReport && (() => {
          const grandTotal = viewOrders.reduce((s, o) => s + calculateOrderTotal(o), 0)
          const paidTotal = viewOrders.filter(o => o.is_paid).reduce((s, o) => s + calculateOrderTotal(o), 0)
          const unpaidTotal = viewOrders.filter(o => !o.is_paid).reduce((s, o) => s + calculateOrderTotal(o), 0)
          const cogs = viewOrders.reduce((s, o) => s + (o.order_items || []).reduce((ss, i) => ss + (parseFloat(i.parts_cost) || 0), 0), 0)
          return (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
                  <div className="text-xl font-bold text-blue-600">{viewOrders.length}</div>
                  <div className="text-xs text-gray-600 mt-1">Porosi</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                  <div className="text-xl font-bold text-green-600">{formatCurrency(grandTotal)}</div>
                  <div className="text-xs text-gray-600 mt-1">Të Ardhura</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 text-center border border-yellow-200">
                  <div className="text-xl font-bold text-yellow-600">{formatCurrency(cogs)}</div>
                  <div className="text-xs text-gray-600 mt-1">Kosto</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center border border-purple-200">
                  <div className="text-xl font-bold text-purple-600">{formatCurrency(grandTotal - cogs)}</div>
                  <div className="text-xs text-gray-600 mt-1">Fitimi</div>
                </div>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {viewOrders.map((order) => {
                  const total = calculateOrderTotal(order)
                  const items = order.order_items || []
                  return (
                    <div key={order.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-mono font-semibold text-sm">#{order.id}</span>
                          <span className="ml-2 font-medium">{order.clients?.full_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary-500">{formatCurrency(total)}</span>
                          <Badge variant={order.is_paid ? 'success' : 'danger'}>{order.is_paid ? 'Paguar' : 'Pa paguar'}</Badge>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        {order.cars?.make} {order.cars?.model} — <span className="font-mono">{order.cars?.license_plate}</span>
                      </div>
                      <div className="space-y-1 mt-2">
                        {items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm pl-3 border-l-2 border-gray-300">
                            <span className="font-medium">{item.service_name}</span>
                            <span>{formatCurrency(item.unit_price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="bg-primary-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-600">Paguar:</span><span className="font-semibold text-green-600">{formatCurrency(paidTotal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Pa paguar:</span><span className="font-semibold text-red-600">{formatCurrency(unpaidTotal)}</span></div>
                <div className="flex justify-between text-xl font-bold border-t pt-2"><span>TOTALI:</span><span className="text-primary-600">{formatCurrency(grandTotal)}</span></div>
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}

export const Invoices = () => {
  const { orders, loading } = useOrders(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [page, setPage] = useState(1)

  const filteredOrders = useMemo(() => {
    let result = orders
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(o => (o.clients?.full_name||'').toLowerCase().includes(q) || (o.cars?.license_plate||'').toLowerCase().includes(q) || (o.cars?.vin||'').toLowerCase().includes(q))
    }
    if (dateFrom) result = result.filter(o => getLocalDate(o.created_at) >= dateFrom)
    if (dateTo) result = result.filter(o => getLocalDate(o.created_at) <= dateTo)
    if (paymentFilter === 'paid') result = result.filter(o => o.is_paid)
    if (paymentFilter === 'unpaid') result = result.filter(o => !o.is_paid)
    return result
  }, [orders, searchQuery, dateFrom, dateTo, paymentFilter])

  useEffect(() => { setPage(1) }, [searchQuery, dateFrom, dateTo, paymentFilter])

  const { totalPages } = usePagination(filteredOrders)
  const paginatedOrders = paginate(filteredOrders, page)

  const clearFilters = () => { setSearchQuery(''); setDateFrom(''); setDateTo(''); setPaymentFilter('all') }
  const hasFilters = searchQuery || dateFrom || dateTo || paymentFilter !== 'all'

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-4xl font-display text-dark-500 mb-2">Faturat</h1>
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
        <div className="flex gap-2 mt-3">
          {[['all', 'Të gjitha'], ['paid', 'Paguar'], ['unpaid', 'Pa paguar']].map(([val, label]) => (
            <button key={val} onClick={() => setPaymentFilter(val)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${paymentFilter === val ? 'bg-primary-400 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {label}
            </button>
          ))}
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

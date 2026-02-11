import { useState, useMemo, useEffect } from 'react'
import { DollarSign, TrendingUp, Package, AlertCircle, Calendar, X, Printer, Eye } from 'lucide-react'
import { Card, StatCard } from '../components/Card'
import { Button } from '../components/Button'
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell, Badge } from '../components/Table'
import { Loading } from '../components/Loading'
import { Pagination, paginate, usePagination } from '../components/Pagination'
import { useOrders } from '../hooks/useData'
import { formatCurrency, formatDate, calculateOrderTotal } from '../utils/helpers'
import { printDailyReport } from '../utils/printOrder'

const todayISO = () => new Date().toISOString().split('T')[0]

export const Dashboard = () => {
  const { orders, loading: ordersLoading } = useOrders()
  const [dateFrom, setDateFrom] = useState(todayISO())
  const [dateTo, setDateTo] = useState(todayISO())
  const [showAll, setShowAll] = useState(false)
  const [page, setPage] = useState(1)

  const filteredOrders = useMemo(() => {
    if (showAll && !dateFrom && !dateTo) return orders
    let result = orders
    if (dateFrom) { const f = new Date(dateFrom); f.setHours(0,0,0,0); result = result.filter(o => new Date(o.created_at) >= f) }
    if (dateTo) { const t = new Date(dateTo); t.setHours(23,59,59,999); result = result.filter(o => new Date(o.created_at) <= t) }
    return result
  }, [orders, dateFrom, dateTo, showAll])

  useEffect(() => { setPage(1) }, [dateFrom, dateTo, showAll])

  const stats = useMemo(() => {
    const c = filteredOrders.reduce((acc, order) => {
      const items = order.order_items || []
      const revenue = items.reduce((s, i) => s + (i.quantity * i.unit_price), 0)
      const cogs = items.reduce((s, i) => s + (parseFloat(i.parts_cost) || 0), 0)
      acc.totalRevenue += revenue; acc.totalCOGS += cogs
      if (!order.is_paid) acc.pendingOrders++
      return acc
    }, { totalRevenue: 0, totalCOGS: 0, pendingOrders: 0 })
    c.netProfit = c.totalRevenue - c.totalCOGS
    return c
  }, [filteredOrders])

  const { totalPages } = usePagination(filteredOrders)
  const paginatedOrders = paginate(filteredOrders, page)

  const isToday = dateFrom === todayISO() && dateTo === todayISO() && !showAll

  const handleShowAll = () => { setShowAll(true); setDateFrom(''); setDateTo('') }
  const handleResetToday = () => { setShowAll(false); setDateFrom(todayISO()); setDateTo(todayISO()) }

  const handlePrintReport = () => {
    let label = 'Sot — ' + formatDate(new Date())
    if (showAll && !dateFrom && !dateTo) label = 'Të gjitha porositë'
    else if (dateFrom && dateTo && dateFrom === dateTo) label = formatDate(new Date(dateFrom + 'T12:00:00'))
    else if (dateFrom && dateTo) label = formatDate(new Date(dateFrom + 'T12:00:00')) + ' — ' + formatDate(new Date(dateTo + 'T12:00:00'))
    else if (dateFrom) label = 'Nga ' + formatDate(new Date(dateFrom + 'T12:00:00'))
    else if (dateTo) label = 'Deri ' + formatDate(new Date(dateTo + 'T12:00:00'))
    printDailyReport(filteredOrders, label)
  }

  if (ordersLoading) return <Loading />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display text-dark-500 mb-2">Paneli</h1>
          <p className="text-gray-600">
            {isToday ? 'Pasqyra e ditës së sotme' : showAll ? 'Të gjitha porositë' : 'Porositë e filtruara'}
          </p>
        </div>
        <Button onClick={handlePrintReport} className="flex items-center gap-2" variant="secondary">
          <Printer className="w-5 h-5" /> Printo Raportin
        </Button>
      </div>

      <Card className="!p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600"><Calendar className="w-4 h-4" /> Periudha:</div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Nga</label>
            <input type="date" value={dateFrom} onChange={(e) => { setShowAll(false); setDateFrom(e.target.value) }}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Deri</label>
            <input type="date" value={dateTo} onChange={(e) => { setShowAll(false); setDateTo(e.target.value) }}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all text-sm" />
          </div>
          {!isToday && (
            <Button variant="outline" size="sm" onClick={handleResetToday} className="flex items-center gap-1 h-[38px]">
              <Calendar className="w-4 h-4" /> Sot
            </Button>
          )}
          {!showAll && (
            <Button variant="outline" size="sm" onClick={handleShowAll} className="flex items-center gap-1 h-[38px]">
              <Eye className="w-4 h-4" /> Të gjitha
            </Button>
          )}
          <span className="text-sm text-gray-500 ml-2">{filteredOrders.length} porosi</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Të Ardhurat" value={formatCurrency(stats.totalRevenue)} icon={DollarSign} color="primary" />
        <StatCard label="Fitimi Neto" value={formatCurrency(stats.netProfit)} icon={TrendingUp} color="success" />
        <StatCard label="Kosto (COGS)" value={formatCurrency(stats.totalCOGS)} icon={Package} color="warning" />
        <StatCard label="Pa Paguar" value={stats.pendingOrders} icon={AlertCircle} color="danger" />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display text-dark-500">
            {isToday ? 'Porositë e Sotme' : showAll ? 'Të Gjitha Porositë' : 'Porositë e Filtruara'}
          </h2>
        </div>
        {filteredOrders.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            {isToday ? 'Nuk ka porosi sot ende' : 'Nuk ka porosi në këtë interval'}
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableHeaderCell>ID</TableHeaderCell>
                <TableHeaderCell>Klienti</TableHeaderCell>
                <TableHeaderCell>Automjeti</TableHeaderCell>
                <TableHeaderCell>Totali</TableHeaderCell>
                <TableHeaderCell>Statusi</TableHeaderCell>
                <TableHeaderCell>Data</TableHeaderCell>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell><span className="font-mono font-semibold text-dark-500">#{order.id}</span></TableCell>
                    <TableCell><span className="font-medium">{order.clients?.full_name || 'N/A'}</span></TableCell>
                    <TableCell><span className="text-gray-600">{order.cars?.make} {order.cars?.model}</span></TableCell>
                    <TableCell><span className="font-semibold text-dark-500">{formatCurrency(calculateOrderTotal(order))}</span></TableCell>
                    <TableCell><Badge variant={order.is_paid ? 'success' : 'danger'}>{order.is_paid ? 'Paguar' : 'Pa paguar'}</Badge></TableCell>
                    <TableCell><span className="text-gray-600">{formatDate(order.created_at)}</span></TableCell>
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

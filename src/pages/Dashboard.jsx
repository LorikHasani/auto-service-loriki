import { useState, useMemo, useEffect } from 'react'
import { DollarSign, TrendingUp, Package, AlertCircle, Calendar, X } from 'lucide-react'
import { Card, StatCard } from '../components/Card'
import { Button } from '../components/Button'
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell, Badge } from '../components/Table'
import { Loading } from '../components/Loading'
import { Pagination, paginate, usePagination } from '../components/Pagination'
import { useOrders } from '../hooks/useData'
import { formatCurrency, formatDate, calculateOrderTotal } from '../utils/helpers'

export const Dashboard = () => {
  const { orders, loading: ordersLoading } = useOrders()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const hasFilters = dateFrom || dateTo

  const filteredOrders = useMemo(() => {
    let result = orders
    if (dateFrom) { const f = new Date(dateFrom); f.setHours(0,0,0,0); result = result.filter(o => new Date(o.created_at) >= f) }
    if (dateTo) { const t = new Date(dateTo); t.setHours(23,59,59,999); result = result.filter(o => new Date(o.created_at) <= t) }
    return result
  }, [orders, dateFrom, dateTo])

  useEffect(() => { setPage(1) }, [dateFrom, dateTo])

  const stats = useMemo(() => {
    const c = filteredOrders.reduce((acc, order) => {
      const items = order.order_items || []
      const revenue = items.reduce((s, i) => s + (i.quantity * i.unit_price), 0)
      const cogs = items.reduce((s, i) => s + (i.parts_cost || 0), 0)
      acc.totalRevenue += revenue; acc.totalCOGS += cogs
      if (!order.is_paid) acc.pendingOrders++
      return acc
    }, { totalRevenue: 0, totalCOGS: 0, pendingOrders: 0 })
    c.netProfit = c.totalRevenue - c.totalCOGS
    return c
  }, [filteredOrders])

  const { totalPages } = usePagination(filteredOrders)
  const paginatedOrders = paginate(filteredOrders, page)

  if (ordersLoading) return <Loading />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-display text-dark-500 mb-2">Paneli</h1>
        <p className="text-gray-600">Mirë se u kthyet! Ja një pasqyrë e biznesit tuaj.</p>
      </div>

      <Card className="!p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600"><Calendar className="w-4 h-4" /> Filtro sipas datës:</div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Nga</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Deri</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all text-sm" />
          </div>
          {hasFilters && <Button variant="outline" size="sm" onClick={() => { setDateFrom(''); setDateTo('') }} className="flex items-center gap-1"><X className="w-4 h-4" /> Pastro</Button>}
          {hasFilters && <span className="text-sm text-gray-500 ml-2">{filteredOrders.length} porosi në interval</span>}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Të Ardhurat Totale" value={formatCurrency(stats.totalRevenue)} icon={DollarSign} color="primary" />
        <StatCard label="Fitimi Neto" value={formatCurrency(stats.netProfit)} icon={TrendingUp} color="success" />
        <StatCard label="Kosto (COGS)" value={formatCurrency(stats.totalCOGS)} icon={Package} color="warning" />
        <StatCard label="Porosi Në Pritje" value={stats.pendingOrders} icon={AlertCircle} color="danger" />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display text-dark-500">{hasFilters ? 'Porositë e Filtruara' : 'Porositë e Fundit'}</h2>
        </div>
        {filteredOrders.length === 0 ? (
          <p className="text-center text-gray-500 py-8">{hasFilters ? 'Nuk ka porosi në këtë interval' : 'Nuk ka porosi ende'}</p>
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

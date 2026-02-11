import { Printer, RotateCcw } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell, Badge } from '../components/Table'
import { Loading, EmptyState } from '../components/Loading'
import { useOrders } from '../hooks/useData'
import { formatCurrency, calculateOrderTotal, formatDate } from '../utils/helpers'
import { printOrderDocument } from '../utils/printOrder'
import { supabase } from '../services/supabase'

export const Archive = () => {
  const { orders, loading, refetch } = useOrders(true)
  const archivedOrders = orders.filter(o => o.is_archived)

  const unarchiveOrder = async (id) => {
    if (!confirm('Kthe këtë porosi në porositë aktive?')) return
    try { const { error } = await supabase.from('orders').update({ is_archived: false, archived_at: null }).eq('id', id); if (error) throw error; refetch() }
    catch (error) { alert('Gabim: ' + error.message) }
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-display text-dark-500 mb-2">Arkiva</h1>
        <p className="text-gray-600">Shiko dhe menaxho porositë e arkivuara</p>
      </div>
      <Card>
        {archivedOrders.length === 0 ? (
          <EmptyState title="Nuk ka porosi të arkivuara" description="Porositë më të vjetra se 1 ditë do të shfaqen këtu automatikisht" />
        ) : (
          <Table>
            <TableHeader>
              <TableHeaderCell>ID</TableHeaderCell>
              <TableHeaderCell>Klienti</TableHeaderCell>
              <TableHeaderCell>Automjeti</TableHeaderCell>
              <TableHeaderCell>Shërbimet</TableHeaderCell>
              <TableHeaderCell>Totali</TableHeaderCell>
              <TableHeaderCell>Statusi</TableHeaderCell>
              <TableHeaderCell>Krijuar</TableHeaderCell>
              <TableHeaderCell>Arkivuar</TableHeaderCell>
              <TableHeaderCell>Veprime</TableHeaderCell>
            </TableHeader>
            <TableBody>
              {archivedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell><span className="font-mono font-semibold">#{order.id}</span></TableCell>
                  <TableCell><span className="font-medium">{order.clients?.full_name}</span></TableCell>
                  <TableCell>{order.cars?.make} {order.cars?.model}</TableCell>
                  <TableCell>
                    <div className="text-sm">{order.order_items?.map((item, idx) => <div key={idx} className="mb-1">• {item.service_name}</div>)}</div>
                  </TableCell>
                  <TableCell><span className="font-semibold">{formatCurrency(calculateOrderTotal(order))}</span></TableCell>
                  <TableCell><Badge variant={order.is_paid ? 'success' : 'danger'}>{order.is_paid ? 'Paguar' : 'Pa paguar'}</Badge></TableCell>
                  <TableCell><span className="text-sm text-gray-600">{formatDate(order.created_at)}</span></TableCell>
                  <TableCell><span className="text-sm text-gray-600">{formatDate(order.archived_at)}</span></TableCell>
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
        )}
      </Card>
    </div>
  )
}

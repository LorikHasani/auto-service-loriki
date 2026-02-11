import { useState, useEffect } from 'react'
import { Plus, Printer, CheckCircle, XCircle, Trash2, Archive, X, Edit2 } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Input, Select } from '../components/Input'
import { Modal } from '../components/Modal'
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell, Badge } from '../components/Table'
import { Loading, EmptyState } from '../components/Loading'
import { Pagination, paginate, usePagination } from '../components/Pagination'
import { useOrders, useClients, useCars, useServices, useEmployees } from '../hooks/useData'
import { formatCurrency, calculateOrderTotal, formatDate } from '../utils/helpers'
import { printOrderDocument } from '../utils/printOrder'
import { supabase } from '../services/supabase'

export const Orders = () => {
  const { orders, loading, refetch } = useOrders(false)
  const { clients } = useClients()
  const { cars } = useCars()
  const { services } = useServices()
  const { employees } = useEmployees()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const [printOrderData, setPrintOrderData] = useState(null)
  const [printShowPrices, setPrintShowPrices] = useState(true)
  const [printShowInvoiceNo, setPrintShowInvoiceNo] = useState(true)
  const [editingOrder, setEditingOrder] = useState(null)
  const [clientCars, setClientCars] = useState([])
  const [formData, setFormData] = useState({
    client_id: '', car_id: '', km: '', employee_name: '',
  })
  const [orderServices, setOrderServices] = useState([
    { service_id: '', service_name: '', labor_cost: 0, parts: [{ name: '', quantity: 1, buy_price: 0, sell_price: 0 }] }
  ])
  const [submitting, setSubmitting] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (formData.client_id) {
      setClientCars(cars.filter(car => car.client_id === parseInt(formData.client_id)))
    } else { setClientCars([]) }
  }, [formData.client_id, cars])

  const resetForm = () => {
    setEditingOrder(null)
    setFormData({ client_id: '', car_id: '', km: '', employee_name: '' })
    setOrderServices([{ service_id: '', service_name: '', labor_cost: 0, parts: [{ name: '', quantity: 1, buy_price: 0, sell_price: 0 }] }])
  }

  const openCreateModal = () => { resetForm(); setIsModalOpen(true) }

  const openEditModal = (order) => {
    setEditingOrder(order)
    setFormData({
      client_id: String(order.client_id || ''),
      car_id: String(order.car_id || ''),
      km: order.km ? String(order.km) : '',
      employee_name: order.employee_name || '',
    })

    // Reconstruct services from order_items
    const items = order.order_items || []
    if (items.length > 0) {
      const reconstructed = items.map(item => {
        const partsJson = item.parts_json || []
        const parts = partsJson.length > 0
          ? partsJson.map(p => ({ name: p.name || '', quantity: p.quantity || 1, buy_price: p.buy_price || 0, sell_price: p.sell_price || 0 }))
          : [{ name: '', quantity: 1, buy_price: 0, sell_price: 0 }]

        // Try to find service by name
        const matchedService = services.find(s => s.name === item.service_name)
        return {
          service_id: matchedService ? String(matchedService.id) : '',
          service_name: item.service_name || '',
          labor_cost: item.labor_cost || 0,
          parts
        }
      })
      setOrderServices(reconstructed)
    } else {
      setOrderServices([{ service_id: '', service_name: '', labor_cost: 0, parts: [{ name: '', quantity: 1, buy_price: 0, sell_price: 0 }] }])
    }
    setIsModalOpen(true)
  }

  const handleAddService = () => {
    setOrderServices([...orderServices, { service_id: '', service_name: '', labor_cost: 0, parts: [{ name: '', quantity: 1, buy_price: 0, sell_price: 0 }] }])
  }
  const handleRemoveService = (i) => { if (orderServices.length > 1) setOrderServices(orderServices.filter((_, idx) => idx !== i)) }
  const handleServiceChange = (i, field, value) => { const n = [...orderServices]; n[i][field] = value; setOrderServices(n) }
  const handleServiceSelect = (i, serviceId) => {
    const svc = services.find(s => s.id === parseInt(serviceId))
    if (svc) { handleServiceChange(i, 'service_id', serviceId); handleServiceChange(i, 'service_name', svc.name) }
    else { handleServiceChange(i, 'service_id', ''); handleServiceChange(i, 'service_name', '') }
  }
  const handleAddPart = (si) => { const n = [...orderServices]; n[si].parts.push({ name: '', quantity: 1, buy_price: 0, sell_price: 0 }); setOrderServices(n) }
  const handleRemovePart = (si, pi) => { const n = [...orderServices]; if (n[si].parts.length > 1) { n[si].parts = n[si].parts.filter((_, i) => i !== pi); setOrderServices(n) } }
  const handlePartChange = (si, pi, field, value) => { const n = [...orderServices]; n[si].parts[pi][field] = value; setOrderServices(n) }

  const calculateServiceTotals = (service) => {
    const laborCost = parseFloat(service.labor_cost) || 0
    const partsCost = service.parts.reduce((s, p) => s + (p.quantity * p.buy_price), 0)
    const partsSold = service.parts.reduce((s, p) => s + (p.quantity * p.sell_price), 0)
    return { laborCost, partsCost, partsSold, total: laborCost + partsSold, profit: laborCost + partsSold - partsCost }
  }

  const calculateOrderTotals = () => {
    return orderServices.reduce((acc, svc) => {
      const t = calculateServiceTotals(svc)
      acc.laborCost += t.laborCost; acc.partsCost += t.partsCost; acc.partsSold += t.partsSold
      acc.total += t.total; acc.profit += t.profit; return acc
    }, { laborCost: 0, partsCost: 0, partsSold: 0, total: 0, profit: 0 })
  }

  const buildItemsData = (orderId) => {
    return orderServices.map(service => {
      const st = calculateServiceTotals(service)
      const partsDesc = service.parts.filter(p => p.name).map(p => p.name + ' (' + p.quantity + 'x)').join(', ')
      const partsJson = service.parts.filter(p => p.name).map(p => ({
        name: p.name, quantity: parseFloat(p.quantity) || 1,
        buy_price: parseFloat(p.buy_price) || 0, sell_price: parseFloat(p.sell_price) || 0
      }))
      return {
        order_id: orderId,
        service_name: service.service_name || 'Shërbim',
        description: partsDesc || null,
        quantity: 1, unit_price: st.total, labor_cost: st.laborCost, parts_cost: st.partsCost,
        parts_json: partsJson.length > 0 ? partsJson : null
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      if (editingOrder) {
        // Update existing order
        const { error: orderError } = await supabase.from('orders').update({
          client_id: formData.client_id, car_id: formData.car_id,
          km: formData.km ? parseInt(formData.km) : null,
          employee_name: formData.employee_name || null,
        }).eq('id', editingOrder.id)
        if (orderError) throw orderError

        // Delete old items and insert new
        const { error: delError } = await supabase.from('order_items').delete().eq('order_id', editingOrder.id)
        if (delError) throw delError

        const newItems = buildItemsData(editingOrder.id)
        const { error: itemsError } = await supabase.from('order_items').insert(newItems)
        if (itemsError) throw itemsError
      } else {
        // Create new order
        const { data: order, error: orderError } = await supabase.from('orders').insert([{
          client_id: formData.client_id, car_id: formData.car_id,
          km: formData.km ? parseInt(formData.km) : null,
          employee_name: formData.employee_name || null,
          is_paid: false, is_archived: false
        }]).select().single()
        if (orderError) throw orderError

        const newItems = buildItemsData(order.id)
        const { error: itemsError } = await supabase.from('order_items').insert(newItems)
        if (itemsError) throw itemsError
      }

      setIsModalOpen(false); resetForm(); refetch()
    } catch (error) { alert('Gabim: ' + error.message) }
    finally { setSubmitting(false) }
  }

  const togglePaid = async (id, isPaid) => {
    try { const { error } = await supabase.from('orders').update({ is_paid: isPaid }).eq('id', id); if (error) throw error; refetch() }
    catch (error) { alert('Gabim: ' + error.message) }
  }

  const archiveOldOrders = async () => {
    setArchiving(true)
    try { const { error } = await supabase.rpc('archive_old_orders'); if (error) throw error; refetch(); setIsArchiveModalOpen(false); alert('Porositë e vjetra u arkivuan!') }
    catch (error) { alert('Gabim: ' + error.message) }
    finally { setArchiving(false) }
  }

  const openPrintModal = (order) => { setPrintOrderData(order); setPrintShowPrices(true); setPrintShowInvoiceNo(true); setIsPrintModalOpen(true) }

  const executePrint = () => {
    if (!printOrderData) return
    printOrderDocument(printOrderData, { showPrices: printShowPrices, showOrderNo: printShowInvoiceNo })
    setIsPrintModalOpen(false)
  }

  if (loading) return <Loading />
  const orderTotals = calculateOrderTotals()
  const { totalPages } = usePagination(orders)
  const paginatedOrders = paginate(orders, page)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display text-dark-500 mb-2">Porositë</h1>
          <p className="text-gray-600">Porositë aktive të servisit</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setIsArchiveModalOpen(true)} variant="secondary" className="flex items-center gap-2"><Archive className="w-5 h-5" /> Arkivo</Button>
          <Button onClick={openCreateModal} className="flex items-center gap-2"><Plus className="w-5 h-5" /> Porosi e Re</Button>
        </div>
      </div>

      <Card>
        {orders.length === 0 ? (
          <EmptyState title="Nuk ka porosi aktive" description="Krijo porosinë e parë të servisit"
            action={<Button onClick={openCreateModal}><Plus className="w-5 h-5 mr-2" />Krijo Porosi</Button>} />
        ) : (
          <>
          <Table>
            <TableHeader>
              <TableHeaderCell>ID</TableHeaderCell>
              <TableHeaderCell>Klienti</TableHeaderCell>
              <TableHeaderCell>Automjeti</TableHeaderCell>
              <TableHeaderCell>Km</TableHeaderCell>
              <TableHeaderCell>Punonjësi</TableHeaderCell>
              <TableHeaderCell>Shërbimet</TableHeaderCell>
              <TableHeaderCell>Totali</TableHeaderCell>
              <TableHeaderCell>Statusi</TableHeaderCell>
              <TableHeaderCell>Veprime</TableHeaderCell>
            </TableHeader>
            <TableBody>
              {paginatedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell><span className="font-mono font-semibold">#{order.id}</span></TableCell>
                  <TableCell><span className="font-medium">{order.clients?.full_name}</span></TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {order.cars?.make} {order.cars?.model}
                      <span className="block text-xs text-gray-400">{order.cars?.license_plate}</span>
                    </span>
                  </TableCell>
                  <TableCell><span className="text-sm">{order.km ? Number(order.km).toLocaleString() : '\u2014'}</span></TableCell>
                  <TableCell><span className="text-sm text-gray-600">{order.employee_name || '\u2014'}</span></TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      {order.order_items?.map((item, idx) => <div key={idx}>• {item.service_name}</div>)}
                    </div>
                  </TableCell>
                  <TableCell><span className="font-semibold">{formatCurrency(calculateOrderTotal(order))}</span></TableCell>
                  <TableCell><Badge variant={order.is_paid ? 'success' : 'danger'}>{order.is_paid ? 'Paguar' : 'Pa paguar'}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant={order.is_paid ? 'danger' : 'success'} onClick={() => togglePaid(order.id, !order.is_paid)}
                        title={order.is_paid ? 'Shëno si pa paguar' : 'Shëno si paguar'}>
                        {order.is_paid ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEditModal(order)} title="Ndrysho">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => openPrintModal(order)} title="Printo">
                        <Printer className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={orders.length} />
          </>
        )}
      </Card>

      {/* Create / Edit Order Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm() }} title={editingOrder ? 'Ndrysho Porosinë #' + editingOrder.id : 'Krijo Porosi'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <Select label="Klienti" value={formData.client_id} onChange={(e) => setFormData({ ...formData, client_id: e.target.value, car_id: '' })} required>
              <option value="">Zgjidh Klientin</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </Select>
            <Select label="Automjeti" value={formData.car_id} onChange={(e) => setFormData({ ...formData, car_id: e.target.value })} required disabled={!formData.client_id}>
              <option value="">Zgjidh Automjetin</option>
              {clientCars.map((c) => <option key={c.id} value={c.id}>{c.make} {c.model} ({c.license_plate})</option>)}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Kilometrazhi (Km)" type="number" min="0" value={formData.km}
              onChange={(e) => setFormData({ ...formData, km: e.target.value })} placeholder="p.sh., 125000" />
            <Select label="Punonjësi" value={formData.employee_name} onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}>
              <option value="">Zgjidh Punonjësin</option>
              {employees.map((emp) => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
            </Select>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-dark-500">Shërbimet</h3>
              <Button type="button" size="sm" onClick={handleAddService}><Plus className="w-4 h-4 mr-1" /> Shto Shërbim</Button>
            </div>

            <div className="space-y-4">
              {orderServices.map((service, si) => {
                const st = calculateServiceTotals(service)
                return (
                  <div key={si} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <Select label={'Shërbimi ' + (si + 1)} value={service.service_id} onChange={(e) => handleServiceSelect(si, e.target.value)} required>
                          <option value="">Zgjidh Shërbimin</option>
                          {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </Select>
                      </div>
                      {orderServices.length > 1 && (
                        <button type="button" onClick={() => handleRemoveService(si)} className="ml-3 mt-7 text-red-500 hover:text-red-700 p-2"><X className="w-5 h-5" /></button>
                      )}
                    </div>

                    <Input label="Kosto Punës (€)" type="number" step="0.01" min="0" value={service.labor_cost}
                      onChange={(e) => handleServiceChange(si, 'labor_cost', e.target.value)} placeholder="0.00" required />

                    <div className="mt-3">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pjesët</label>
                        <button type="button" onClick={() => handleAddPart(si)} className="text-sm text-primary-600 hover:text-primary-700 font-medium">+ Shto Pjesë</button>
                      </div>
                      <div className="space-y-2">
                        {service.parts.map((part, pi) => (
                          <div key={pi} className="p-2 bg-white rounded-lg border border-gray-200">
                            <div className="space-y-2">
                              <div className="flex gap-2 items-center">
                                <Input placeholder="Emri i pjesës" value={part.name} onChange={(e) => handlePartChange(si, pi, 'name', e.target.value)} className="flex-1" />
                                {service.parts.length > 1 && (
                                  <button type="button" onClick={() => handleRemovePart(si, pi)} className="text-red-500 hover:text-red-700 p-2"><Trash2 className="w-4 h-4" /></button>
                                )}
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <Input type="number" step="any" min="0" placeholder="Sasia" value={part.quantity} onChange={(e) => handlePartChange(si, pi, 'quantity', e.target.value)} />
                                <Input type="number" step="0.01" min="0" placeholder="Blerje €" value={part.buy_price} onChange={(e) => handlePartChange(si, pi, 'buy_price', e.target.value)} />
                                <Input type="number" step="0.01" min="0" placeholder="Shitje €" value={part.sell_price} onChange={(e) => handlePartChange(si, pi, 'sell_price', e.target.value)} />
                              </div>
                              {part.name && (
                                <div className="text-xs text-gray-600">
                                  Kosto: {formatCurrency(part.quantity * part.buy_price)} → Shitje: {formatCurrency(part.quantity * part.sell_price)} =
                                  <span className="font-semibold"> Fitimi: {formatCurrency((part.quantity * part.sell_price) - (part.quantity * part.buy_price))}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-300 space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-gray-600">Puna:</span><span className="font-semibold">{formatCurrency(st.laborCost)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Totali Pjesëve:</span><span className="font-semibold text-green-600">{formatCurrency(st.partsSold)}</span></div>
                      <div className="flex justify-between font-bold"><span>Totali Shërbimit:</span><span className="text-primary-600">{formatCurrency(st.total)}</span></div>
                      <div className="flex justify-between font-bold"><span>Fitimi Shërbimit:</span><span className={st.profit >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(st.profit)}</span></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="border-t pt-4 bg-primary-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-600">Totali Punës:</span><span className="font-semibold">{formatCurrency(orderTotals.laborCost)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">Kosto Pjesëve:</span><span className="font-semibold text-red-600">-{formatCurrency(orderTotals.partsCost)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">Shitja Pjesëve:</span><span className="font-semibold text-green-600">+{formatCurrency(orderTotals.partsSold)}</span></div>
            <div className="flex justify-between text-xl font-bold border-t pt-2"><span>TOTALI:</span><span className="text-primary-600">{formatCurrency(orderTotals.total)}</span></div>
            <div className="flex justify-between text-xl font-bold"><span>FITIMI:</span><span className={orderTotals.profit >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(orderTotals.profit)}</span></div>
          </div>

          <div className="flex gap-3 justify-end pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); resetForm() }}>Anulo</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Duke ruajtur...' : editingOrder ? 'Përditëso Porosinë' : 'Krijo Porosinë'}</Button>
          </div>
        </form>
      </Modal>

      {/* Print Modal */}
      <Modal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} title="Opsionet e Printimit" size="sm">
        <div className="space-y-5">
          {printOrderData && (
            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              <p><strong>Porosi:</strong> #{printOrderData.id}</p>
              <p><strong>Klienti:</strong> {printOrderData.clients?.full_name}</p>
              <p><strong>Automjeti:</strong> {printOrderData.cars?.make} {printOrderData.cars?.model}</p>
            </div>
          )}
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
              <input type="checkbox" checked={printShowPrices} onChange={(e) => setPrintShowPrices(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary-400 focus:ring-primary-400" />
              <div><span className="font-medium text-sm">Shfaq çmimet</span><p className="text-xs text-gray-500">Çmimi, sasia dhe totali</p></div>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
              <input type="checkbox" checked={printShowInvoiceNo} onChange={(e) => setPrintShowInvoiceNo(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary-400 focus:ring-primary-400" />
              <div><span className="font-medium text-sm">Shfaq numrin e porosisë</span><p className="text-xs text-gray-500">Numri # i porosisë në krye</p></div>
            </label>
          </div>
          <div className="flex gap-3 justify-end pt-3 border-t">
            <Button variant="outline" onClick={() => setIsPrintModalOpen(false)}>Anulo</Button>
            <Button onClick={executePrint} className="flex items-center gap-2"><Printer className="w-4 h-4" /> Printo</Button>
          </div>
        </div>
      </Modal>

      {/* Archive Modal */}
      <Modal isOpen={isArchiveModalOpen} onClose={() => setIsArchiveModalOpen(false)} title="Arkivo Porositë e Vjetra">
        <div className="space-y-4">
          <p className="text-gray-700">Kjo do të arkivojë të gjitha porositë më të vjetra se 1 ditë.</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">Porositë para {formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000))} do të arkivohen.</p>
          </div>
          <div className="flex gap-3 justify-end pt-3">
            <Button type="button" variant="outline" onClick={() => setIsArchiveModalOpen(false)}>Anulo</Button>
            <Button variant="secondary" onClick={archiveOldOrders} disabled={archiving}>{archiving ? 'Duke arkivuar...' : 'Arkivo Porositë'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

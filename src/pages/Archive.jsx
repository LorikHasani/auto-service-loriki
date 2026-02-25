import { useState, useMemo, useEffect } from 'react'
import { Printer, RotateCcw, Search, Calendar, X, Edit2, CheckCircle, XCircle, Plus, Trash2 } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Modal } from '../components/Modal'
import { SearchableSelect } from '../components/SearchableSelect'
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell, Badge } from '../components/Table'
import { Loading, EmptyState } from '../components/Loading'
import { Pagination, paginate, usePagination } from '../components/Pagination'
import { useOrders, useClients, useCars, useServices, useEmployees } from '../hooks/useData'
import { formatCurrency, calculateOrderTotal, formatDate } from '../utils/helpers'
import { printOrderDocument } from '../utils/printOrder'
import { supabase } from '../services/supabase'

const getLocalDate = (ts) => {
  const d = new Date(ts)
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

export const Archive = () => {
  const { orders, loading, refetch } = useOrders(true)
  const { clients } = useClients()
  const { cars } = useCars()
  const { services } = useServices()
  const { employees } = useEmployees()

  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [page, setPage] = useState(1)

  // Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [clientCars, setClientCars] = useState([])
  const [formData, setFormData] = useState({ client_id: '', car_id: '', km: '', employee_name: '' })
  const [orderServices, setOrderServices] = useState([
    { service_id: '', service_name: '', labor_cost: 0, parts: [{ name: '', quantity: 1, buy_price: 0, sell_price: 0 }] }
  ])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (formData.client_id) setClientCars(cars.filter(c => c.client_id === parseInt(formData.client_id)))
    else setClientCars([])
  }, [formData.client_id, cars])

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
    if (paymentFilter === 'paid') result = result.filter(o => o.is_paid)
    if (paymentFilter === 'unpaid') result = result.filter(o => !o.is_paid)
    return result
  }, [orders, searchQuery, dateFrom, dateTo, paymentFilter])

  useEffect(() => { setPage(1) }, [searchQuery, dateFrom, dateTo, paymentFilter])

  const { totalPages } = usePagination(archivedOrders)
  const paginatedOrders = paginate(archivedOrders, page)

  const hasFilters = searchQuery || dateFrom || dateTo || paymentFilter !== 'all'
  const clearFilters = () => { setSearchQuery(''); setDateFrom(''); setDateTo(''); setPaymentFilter('all') }

  const unarchiveOrder = async (id) => {
    if (!confirm('Kthe këtë porosi në servisimet aktive?')) return
    try { const { error } = await supabase.from('orders').update({ is_archived: false, archived_at: null }).eq('id', id); if (error) throw error; refetch() }
    catch (error) { alert('Gabim: ' + error.message) }
  }

  const togglePaid = async (id, isPaid) => {
    try { const { error } = await supabase.from('orders').update({ is_paid: isPaid }).eq('id', id); if (error) throw error; refetch() }
    catch (error) { alert('Gabim: ' + error.message) }
  }

  /* --- Edit Logic --- */
  const resetForm = () => {
    setEditingOrder(null)
    setFormData({ client_id: '', car_id: '', km: '', employee_name: '' })
    setOrderServices([{ service_id: '', service_name: '', labor_cost: 0, parts: [{ name: '', quantity: 1, buy_price: 0, sell_price: 0 }] }])
  }

  const openEditModal = (order) => {
    setEditingOrder(order)
    setFormData({
      client_id: String(order.client_id || ''),
      car_id: String(order.car_id || ''),
      km: order.km ? String(order.km) : '',
      employee_name: order.employee_name || '',
    })
    const items = order.order_items || []
    if (items.length > 0) {
      const reconstructed = items.map(item => {
        const partsJson = item.parts_json || []
        const parts = partsJson.length > 0
          ? partsJson.map(p => ({ name: p.name || '', quantity: p.quantity || 1, buy_price: p.buy_price || 0, sell_price: p.sell_price || 0 }))
          : [{ name: '', quantity: 1, buy_price: 0, sell_price: 0 }]
        const matchedService = services.find(s => s.name === item.service_name)
        return { service_id: matchedService ? String(matchedService.id) : '', service_name: item.service_name || '', labor_cost: item.labor_cost || 0, parts }
      })
      setOrderServices(reconstructed)
    } else {
      setOrderServices([{ service_id: '', service_name: '', labor_cost: 0, parts: [{ name: '', quantity: 1, buy_price: 0, sell_price: 0 }] }])
    }
    setIsModalOpen(true)
  }

  const handleAddService = () => setOrderServices([...orderServices, { service_id: '', service_name: '', labor_cost: 0, parts: [{ name: '', quantity: 1, buy_price: 0, sell_price: 0 }] }])
  const handleRemoveService = (i) => { if (orderServices.length > 1) setOrderServices(orderServices.filter((_, idx) => idx !== i)) }
  const handleServiceChange = (i, f, v) => { const n = [...orderServices]; n[i][f] = v; setOrderServices(n) }
  const handleServiceSelect = (i, id) => {
    const svc = services.find(s => s.id === parseInt(id))
    if (svc) { handleServiceChange(i, 'service_id', id); handleServiceChange(i, 'service_name', svc.name) }
    else { handleServiceChange(i, 'service_id', ''); handleServiceChange(i, 'service_name', '') }
  }
  const handleAddPart = (si) => { const n = [...orderServices]; n[si].parts.push({ name: '', quantity: 1, buy_price: 0, sell_price: 0 }); setOrderServices(n) }
  const handleRemovePart = (si, pi) => { const n = [...orderServices]; if (n[si].parts.length > 1) { n[si].parts = n[si].parts.filter((_, i) => i !== pi); setOrderServices(n) } }
  const handlePartChange = (si, pi, f, v) => { const n = [...orderServices]; n[si].parts[pi][f] = v; setOrderServices(n) }

  const calcServiceTotals = (svc) => {
    const lc = parseFloat(svc.labor_cost) || 0
    const pc = svc.parts.reduce((s, p) => s + (p.quantity * p.buy_price), 0)
    const ps = svc.parts.reduce((s, p) => s + (p.quantity * p.sell_price), 0)
    return { laborCost: lc, partsCost: pc, partsSold: ps, total: lc + ps, profit: lc + ps - pc }
  }
  const orderTotals = orderServices.reduce((a, s) => {
    const t = calcServiceTotals(s)
    return { laborCost: a.laborCost + t.laborCost, partsCost: a.partsCost + t.partsCost, partsSold: a.partsSold + t.partsSold, total: a.total + t.total, profit: a.profit + t.profit }
  }, { laborCost: 0, partsCost: 0, partsSold: 0, total: 0, profit: 0 })

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      const { error: orderError } = await supabase.from('orders').update({
        client_id: formData.client_id, car_id: formData.car_id,
        km: formData.km ? parseInt(formData.km) : null,
        employee_name: formData.employee_name || null,
      }).eq('id', editingOrder.id)
      if (orderError) throw orderError

      const { error: delError } = await supabase.from('order_items').delete().eq('order_id', editingOrder.id)
      if (delError) throw delError

      const newItems = orderServices.map(svc => {
        const st = calcServiceTotals(svc)
        const desc = svc.parts.filter(p => p.name).map(p => p.name + ' (' + p.quantity + 'x)').join(', ')
        const pj = svc.parts.filter(p => p.name).map(p => ({
          name: p.name, quantity: parseFloat(p.quantity) || 1,
          buy_price: parseFloat(p.buy_price) || 0, sell_price: parseFloat(p.sell_price) || 0
        }))
        return {
          order_id: editingOrder.id, service_name: svc.service_name || 'Shërbim',
          description: desc || null, quantity: 1, unit_price: st.total,
          labor_cost: st.laborCost, parts_cost: st.partsCost,
          parts_json: pj.length > 0 ? pj : null
        }
      })
      const { error: itemsErr } = await supabase.from('order_items').insert(newItems)
      if (itemsErr) throw itemsErr

      setIsModalOpen(false); resetForm(); refetch()
    } catch (error) { alert('Gabim: ' + error.message) }
    finally { setSubmitting(false) }
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
        <div className="flex gap-2 mt-3">
          {[['all', 'Të gjitha'], ['paid', 'Paguar'], ['unpaid', 'Pa paguar']].map(([val, label]) => (
            <button key={val} onClick={() => setPaymentFilter(val)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${paymentFilter === val ? 'bg-primary-400 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {label}
            </button>
          ))}
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
                <TableHeaderCell>Pagesa</TableHeaderCell>
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
                      <div className="flex gap-1.5">
                        <Button size="sm" variant={order.is_paid ? 'danger' : 'success'} onClick={() => togglePaid(order.id, !order.is_paid)}
                          title={order.is_paid ? 'Shëno si pa paguar' : 'Shëno si paguar'}>
                          {order.is_paid ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openEditModal(order)} title="Ndrysho">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => unarchiveOrder(order.id)} title="Kthe në aktive">
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => printOrderDocument(order, { showPrices: true, showOrderNo: true })} title="Printo">
                          <Printer className="w-4 h-4" />
                        </Button>
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

      {/* Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm() }} title={editingOrder ? 'Ndrysho Servisimin #' + editingOrder.id : ''} size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SearchableSelect label="Klienti" value={formData.client_id}
              onChange={(val) => setFormData({ ...formData, client_id: val, car_id: '' })} required
              placeholder="Kërko klientin..."
              options={clients.map(c => ({ value: c.id, label: c.full_name, sub: c.phone }))} />
            <SearchableSelect label="Automjeti" value={formData.car_id}
              onChange={(val) => setFormData({ ...formData, car_id: val })} required
              placeholder={formData.client_id ? "Kërko automjetin..." : "Zgjidh klientin fillimisht"}
              options={clientCars.map(c => ({ value: c.id, label: c.make + ' ' + c.model + ' (' + c.license_plate + ')' }))} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Kilometrazhi (Km)" type="number" min="0" value={formData.km}
              onChange={(e) => setFormData({ ...formData, km: e.target.value })} placeholder="p.sh., 125000" />
            <SearchableSelect label="Punonjësi" value={formData.employee_name}
              onChange={(val) => setFormData({ ...formData, employee_name: val })}
              placeholder="Kërko punonjësin..."
              options={employees.map(emp => ({ value: emp.name, label: emp.name }))} />
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-dark-500">Shërbimet</h3>
              <Button type="button" size="sm" onClick={handleAddService}><Plus className="w-4 h-4 mr-1" /> Shto Shërbim</Button>
            </div>
            <div className="space-y-4">
              {orderServices.map((svc, si) => {
                const st = calcServiceTotals(svc)
                return (
                  <div key={si} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <SearchableSelect label={'Shërbimi ' + (si + 1)} value={svc.service_id}
                          onChange={(val) => handleServiceSelect(si, val)} required
                          placeholder="Kërko shërbimin..."
                          options={services.map(s => ({ value: s.id, label: s.name }))} />
                      </div>
                      {orderServices.length > 1 && (
                        <button type="button" onClick={() => handleRemoveService(si)} className="ml-3 mt-7 text-red-500 hover:text-red-700 p-2"><X className="w-5 h-5" /></button>
                      )}
                    </div>

                    <Input label="Kosto Punës (€)" type="number" step="0.01" min="0" value={svc.labor_cost}
                      onChange={(e) => handleServiceChange(si, 'labor_cost', e.target.value)} placeholder="0.00" required />

                    <div className="mt-3">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pjesët</label>
                        <button type="button" onClick={() => handleAddPart(si)} className="text-sm text-primary-600 hover:text-primary-700 font-medium">+ Shto Pjesë</button>
                      </div>
                      <div className="space-y-2">
                        {svc.parts.map((part, pi) => (
                          <div key={pi} className="p-2 bg-white rounded-lg border border-gray-200">
                            <div className="space-y-2">
                              <div className="flex gap-2 items-center">
                                <Input placeholder="Emri i pjesës" value={part.name} onChange={(e) => handlePartChange(si, pi, 'name', e.target.value)} className="flex-1" />
                                {svc.parts.length > 1 && (
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
            <Button type="submit" disabled={submitting}>{submitting ? 'Duke ruajtur...' : 'Përditëso Servisimin'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

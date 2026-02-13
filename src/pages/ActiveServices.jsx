import { useState, useEffect, useRef } from 'react'
import { Plus, X, Car, Wrench, User, Clock, CheckCircle, Trash2, Timer } from 'lucide-react'
import { Card } from '../components/Card'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { SearchableSelect } from '../components/SearchableSelect'
import { useOrders, useClients, useCars, useServices, useEmployees } from '../hooks/useData'
import { Loading } from '../components/Loading'
import { formatCurrency, calculateOrderTotal, formatDate } from '../utils/helpers'
import { supabase } from '../services/supabase'

const LIFT_KEY = 'autoservice_lifts_v2'

const loadLifts = () => {
  try { return JSON.parse(localStorage.getItem(LIFT_KEY)) || [null, null, null] }
  catch { return [null, null, null] }
}
// Each lift: null or { orderId, startTime (ISO) }
const saveLifts = (l) => { try { localStorage.setItem(LIFT_KEY, JSON.stringify(l)) } catch {} }

const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '00:00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
}

const formatDurationShort = (seconds) => {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return h + 'h ' + m + 'min'
  return m + 'min'
}

/* ───────────── LIVE TIMER HOOK ───────────── */
const useLiveTimer = (startTimeISO) => {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!startTimeISO) { setElapsed(0); return }
    const calc = () => Math.floor((Date.now() - new Date(startTimeISO).getTime()) / 1000)
    setElapsed(calc())
    const interval = setInterval(() => setElapsed(calc()), 1000)
    return () => clearInterval(interval)
  }, [startTimeISO])
  return elapsed
}

/* ───────────── LIFT VISUAL ───────────── */
const LiftStation = ({ idx, order, startTime, onAdd, onDone }) => {
  const [lifted, setLifted] = useState(false)
  const elapsed = useLiveTimer(startTime)

  useEffect(() => {
    if (order) { const t = setTimeout(() => setLifted(true), 100); return () => clearTimeout(t) }
    else setLifted(false)
  }, [order])

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-dark-500 text-white flex items-center justify-center font-bold text-sm">{idx + 1}</div>
        <span className="font-display text-dark-500 text-lg">Lifti {idx + 1}</span>
        <div className={`w-3 h-3 rounded-full ${order ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} />
      </div>

      <div className="relative w-full max-w-[280px] h-[320px] bg-gradient-to-b from-gray-100 to-gray-200 rounded-2xl border-2 border-gray-300 overflow-hidden shadow-inner">
        <div className="absolute left-4 top-0 bottom-0 w-2 bg-gray-400 rounded-full" />
        <div className="absolute right-4 top-0 bottom-0 w-2 bg-gray-400 rounded-full" />
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-gray-500 to-gray-400 flex items-center justify-center">
          <div className="w-16 h-3 bg-gray-600 rounded" />
        </div>

        <div className="absolute left-6 right-6 transition-all duration-[1.2s] ease-in-out"
          style={{ bottom: lifted ? '130px' : '40px' }}>
          <div className="h-3 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 rounded shadow-lg" />
          <div className="mx-auto w-4 bg-gradient-to-b from-gray-500 to-gray-600 rounded-b transition-all duration-[1.2s] ease-in-out"
            style={{ height: lifted ? '80px' : '0px' }} />
          {order && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center">
              <svg viewBox="0 0 120 50" className="w-[140px]" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
                <rect x="10" y="20" width="100" height="22" rx="6" fill="#1a1a2e" />
                <path d="M30,20 L42,6 L82,6 L92,20" fill="#2d2d4e" stroke="#1a1a2e" strokeWidth="1" />
                <path d="M44,8 L36,18 L58,18 Z" fill="#87CEEB" opacity="0.7" />
                <path d="M62,8 L62,18 L86,18 L80,8 Z" fill="#87CEEB" opacity="0.7" />
                <rect x="104" y="24" width="8" height="5" rx="2" fill="#FFD700" opacity="0.9" />
                <rect x="4" y="24" width="8" height="5" rx="2" fill="#FF4444" opacity="0.7" />
                <circle cx="30" cy="42" r="9" fill="#333" /><circle cx="30" cy="42" r="5" fill="#666" />
                <circle cx="90" cy="42" r="9" fill="#333" /><circle cx="90" cy="42" r="5" fill="#666" />
              </svg>
            </div>
          )}
        </div>

        {/* Timer overlay */}
        {order && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-dark-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg flex items-center gap-2 z-10">
            <Timer className="w-4 h-4 text-orange-400 animate-pulse" />
            <span className="font-mono text-lg font-bold tracking-wider">{formatDuration(elapsed)}</span>
          </div>
        )}

        {!order && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <button onClick={onAdd}
              className="w-16 h-16 rounded-full bg-white border-2 border-dashed border-primary-400 text-primary-400 flex items-center justify-center hover:bg-primary-50 hover:border-solid hover:shadow-lg transition-all group">
              <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        )}
      </div>

      {order ? (
        <div className="w-full max-w-[280px] mt-3 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-dark-500 text-white px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-primary-400" />
              <span className="text-sm font-semibold">{order.cars?.make} {order.cars?.model}</span>
            </div>
            <span className="text-xs text-gray-400 font-mono">{order.cars?.license_plate}</span>
          </div>
          <div className="px-4 py-3 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-medium">{order.clients?.full_name}</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Wrench className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
              <div className="text-gray-600 text-xs leading-relaxed">
                {(order.order_items || []).map((item, i) => <div key={i}>• {item.service_name}</div>)}
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-sm font-bold text-primary-500">{formatCurrency(calculateOrderTotal(order))}</span>
              <div className="flex items-center gap-1 text-xs font-mono text-orange-600 bg-orange-50 px-2 py-1 rounded">
                <Timer className="w-3 h-3" />
                {formatDuration(elapsed)}
              </div>
            </div>
            <button onClick={() => onDone(elapsed)}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-colors">
              <CheckCircle className="w-4 h-4" /> E kryer
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-[280px] mt-3 text-center py-4">
          <p className="text-sm text-gray-400">Lifti i lirë</p>
          <p className="text-xs text-gray-300 mt-1">Kliko + për të filluar servisimin</p>
        </div>
      )}
    </div>
  )
}

/* ───────────── MAIN PAGE ───────────── */
export const ActiveServices = () => {
  const { orders, loading: ordersLoading, refetch } = useOrders(false)
  const { clients } = useClients()
  const { cars } = useCars()
  const { services } = useServices()
  const { employees } = useEmployees()

  const [liftData, setLiftData] = useState(loadLifts())
  const [selectedLift, setSelectedLift] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [clientCars, setClientCars] = useState([])
  const [formData, setFormData] = useState({ client_id: '', car_id: '', km: '', employee_name: '' })
  const [orderServices, setOrderServices] = useState([
    { service_id: '', service_name: '', labor_cost: 0, parts: [{ name: '', quantity: 1, buy_price: 0, sell_price: 0 }] }
  ])

  useEffect(() => {
    if (formData.client_id) setClientCars(cars.filter(c => c.client_id === parseInt(formData.client_id)))
    else setClientCars([])
  }, [formData.client_id, cars])

  // Resolve lift order objects
  const resolvedLifts = liftData.map(d => {
    if (!d || !d.orderId) return null
    const order = orders.find(o => o.id === d.orderId)
    return order ? { order, startTime: d.startTime } : null
  })

  const updateLifts = (newData) => { setLiftData(newData); saveLifts(newData) }

  const resetForm = () => {
    setFormData({ client_id: '', car_id: '', km: '', employee_name: '' })
    setOrderServices([{ service_id: '', service_name: '', labor_cost: 0, parts: [{ name: '', quantity: 1, buy_price: 0, sell_price: 0 }] }])
  }

  const openLiftModal = (liftIdx) => { setSelectedLift(liftIdx); resetForm(); setIsModalOpen(true) }

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

  /* ─── Submit: create order + assign to lift with timer ─── */
  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      const { data: order, error: orderErr } = await supabase.from('orders').insert([{
        client_id: formData.client_id, car_id: formData.car_id,
        km: formData.km ? parseInt(formData.km) : null,
        employee_name: formData.employee_name || null,
        is_paid: false, is_archived: false
      }]).select().single()
      if (orderErr) throw orderErr

      const items = orderServices.map(svc => {
        const st = calcServiceTotals(svc)
        const desc = svc.parts.filter(p => p.name).map(p => p.name + ' (' + p.quantity + 'x)').join(', ')
        const pj = svc.parts.filter(p => p.name).map(p => ({
          name: p.name, quantity: parseFloat(p.quantity) || 1,
          buy_price: parseFloat(p.buy_price) || 0, sell_price: parseFloat(p.sell_price) || 0
        }))
        return {
          order_id: order.id, service_name: svc.service_name || 'Shërbim',
          description: desc || null, quantity: 1, unit_price: st.total,
          labor_cost: st.laborCost, parts_cost: st.partsCost,
          parts_json: pj.length > 0 ? pj : null
        }
      })
      const { error: itemsErr } = await supabase.from('order_items').insert(items)
      if (itemsErr) throw itemsErr

      // Assign to lift with start time
      const newData = [...liftData]
      newData[selectedLift] = { orderId: order.id, startTime: new Date().toISOString() }
      updateLifts(newData)
      setIsModalOpen(false); resetForm(); refetch()
    } catch (err) { alert('Gabim: ' + err.message) }
    finally { setSubmitting(false) }
  }

  /* ─── Done: save duration to DB, remove from lift ─── */
  const handleDone = async (liftIdx, elapsedSeconds) => {
    const lift = liftData[liftIdx]
    if (lift && lift.orderId) {
      try {
        await supabase.from('orders').update({ service_duration: elapsedSeconds }).eq('id', lift.orderId)
      } catch (err) { console.error('Failed to save duration:', err) }
    }
    const newData = [...liftData]
    newData[liftIdx] = null
    updateLifts(newData)
    refetch()
  }

  if (ordersLoading) return <Loading />

  const activeCount = resolvedLifts.filter(Boolean).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-display text-dark-500 mb-2">Servisimet Aktive</h1>
        <p className="text-gray-600">
          {activeCount}/3 lifte aktive
          {activeCount > 0 && <span className="ml-2 inline-flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> duke punuar</span>}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[0, 1, 2].map(i => {
          const lf = resolvedLifts[i]
          return (
            <LiftStation key={i} idx={i}
              order={lf?.order || null}
              startTime={lf ? liftData[i]?.startTime : null}
              onAdd={() => openLiftModal(i)}
              onDone={(sec) => handleDone(i, sec)} />
          )
        })}
      </div>

      {/* ───── CREATE ORDER MODAL ───── */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm() }}
        title={`Servisim i Ri — Lifti ${(selectedLift || 0) + 1}`} size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <SearchableSelect label="Klienti" value={formData.client_id}
              onChange={(v) => setFormData({ ...formData, client_id: v, car_id: '' })} required
              placeholder="Kërko klientin..."
              options={clients.map(c => ({ value: c.id, label: c.full_name, sub: c.phone }))} />
            <SearchableSelect label="Automjeti" value={formData.car_id}
              onChange={(v) => setFormData({ ...formData, car_id: v })} required
              placeholder={formData.client_id ? "Kërko automjetin..." : "Zgjidh klientin fillimisht"}
              options={clientCars.map(c => ({ value: c.id, label: c.make + ' ' + c.model + ' (' + c.license_plate + ')' }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Kilometrazhi (Km)" type="number" min="0" value={formData.km}
              onChange={(e) => setFormData({ ...formData, km: e.target.value })} placeholder="p.sh., 125000" />
            <SearchableSelect label="Punonjësi" value={formData.employee_name}
              onChange={(v) => setFormData({ ...formData, employee_name: v })}
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
                          onChange={(v) => handleServiceSelect(si, v)} required
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
            <Button type="submit" disabled={submitting}>{submitting ? 'Duke ruajtur...' : 'Krijo Servisimin'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

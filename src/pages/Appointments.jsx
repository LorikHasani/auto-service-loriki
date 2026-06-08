import { useState, useMemo } from 'react'
import { Plus, Trash2, ChevronLeft, ChevronRight, CheckCircle, XCircle, Car as CarIcon } from 'lucide-react'
import { Button } from '../components/Button'
import { Input, Select, TextArea } from '../components/Input'
import { Modal } from '../components/Modal'
import { Loading } from '../components/Loading'
import { SearchableSelect } from '../components/SearchableSelect'
import { useAppointments, useClients, useCars } from '../hooks/useData'
import { supabase } from '../services/supabase'

// Status definitions (Albanian labels + colors)
const STATUSES = {
  scheduled: { label: 'Caktuar', variant: 'warning', chip: 'bg-amber-500 hover:bg-amber-600' },
  confirmed: { label: 'Konfirmuar', variant: 'info', chip: 'bg-blue-500 hover:bg-blue-600' },
  completed: { label: 'Përfunduar', variant: 'success', chip: 'bg-green-500 hover:bg-green-600' },
  cancelled: { label: 'Anuluar', variant: 'danger', chip: 'bg-gray-400 hover:bg-gray-500 line-through' },
}
const STATUS_ORDER = ['scheduled', 'confirmed', 'completed', 'cancelled']

const WEEKDAYS = ['Die', 'Hën', 'Mar', 'Mër', 'Enj', 'Pre', 'Sht']
const MONTHS = ['Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor', 'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor']

// Local YYYY-MM-DD (no timezone shift)
const isoOf = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
const todayISO = () => isoOf(new Date())
const formatTime = (t) => t ? String(t).slice(0, 5) : ''

const emptyForm = (date = todayISO()) => ({
  client_id: '', car_id: '', customer_name: '', phone: '', vehicle_info: '',
  appointment_date: date, appointment_time: '', service_description: '', status: 'scheduled', notes: '',
})
const emptyClient = { full_name: '', phone: '', email: '', address: '' }
const emptyCar = () => ({ make: '', model: '', year: new Date().getFullYear(), color: '', license_plate: '', vin: '' })

export const Appointments = () => {
  const { appointments, loading, refetch } = useAppointments()
  const { clients, refetch: refetchClients } = useClients()
  const { cars, refetch: refetchCars } = useCars()

  const [cursor, setCursor] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() } })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState(emptyForm())
  const [submitting, setSubmitting] = useState(false)

  // Inline add-client / add-car modals
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [clientForm, setClientForm] = useState(emptyClient)
  const [isCarModalOpen, setIsCarModalOpen] = useState(false)
  const [carForm, setCarForm] = useState(emptyCar())

  const clientCars = useMemo(
    () => formData.client_id ? cars.filter(c => c.client_id === parseInt(formData.client_id)) : [],
    [formData.client_id, cars]
  )

  // Group appointments by date for fast lookup
  const byDate = useMemo(() => {
    const map = {}
    for (const a of appointments) {
      if (!map[a.appointment_date]) map[a.appointment_date] = []
      map[a.appointment_date].push(a)
    }
    return map
  }, [appointments])

  // Build 6-week grid (Sunday-first) for the visible month
  const weeks = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1)
    const start = new Date(first)
    start.setDate(first.getDate() - first.getDay())
    const cells = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      cells.push(d)
    }
    const out = []
    for (let w = 0; w < 6; w++) out.push(cells.slice(w * 7, w * 7 + 7))
    return out
  }, [cursor])

  const goToday = () => { const d = new Date(); setCursor({ year: d.getFullYear(), month: d.getMonth() }) }
  const goPrev = () => setCursor(c => { const m = c.month - 1; return m < 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: m } })
  const goNext = () => setCursor(c => { const m = c.month + 1; return m > 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: m } })

  const displayName = (a) => a.clients?.full_name || a.customer_name || 'Pa emër'
  const displayPhone = (a) => a.clients?.phone || a.phone || ''
  const displayVehicle = (a) => {
    if (a.cars) return a.cars.make + ' ' + a.cars.model + (a.cars.license_plate ? ' (' + a.cars.license_plate + ')' : '')
    return a.vehicle_info || ''
  }

  const openCreate = (date) => { setEditing(null); setFormData(emptyForm(date)); setIsModalOpen(true) }
  const openEdit = (appt) => {
    setEditing(appt)
    setFormData({
      client_id: appt.client_id ? String(appt.client_id) : '',
      car_id: appt.car_id ? String(appt.car_id) : '',
      customer_name: appt.customer_name || '',
      phone: appt.phone || '',
      vehicle_info: appt.vehicle_info || '',
      appointment_date: appt.appointment_date,
      appointment_time: formatTime(appt.appointment_time),
      service_description: appt.service_description || '',
      status: appt.status || 'scheduled',
      notes: appt.notes || '',
    })
    setIsModalOpen(true)
  }

  const handleClientChange = (val) => setFormData(f => ({ ...f, client_id: val, car_id: '' }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.client_id) { alert('Zgjidh klientin për terminin.'); return }
    setSubmitting(true)
    try {
      const payload = {
        client_id: parseInt(formData.client_id),
        car_id: formData.car_id ? parseInt(formData.car_id) : null,
        customer_name: null,
        phone: null,
        vehicle_info: null,
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time || null,
        service_description: formData.service_description.trim() || null,
        status: formData.status,
        notes: formData.notes.trim() || null,
      }
      if (editing) {
        const { error } = await supabase.from('appointments').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('appointments').insert([payload])
        if (error) throw error
      }
      setIsModalOpen(false)
      refetch()
    } catch (error) { alert('Gabim: ' + error.message) }
    finally { setSubmitting(false) }
  }

  const updateStatus = async (id, status) => {
    try {
      const { error } = await supabase.from('appointments').update({ status }).eq('id', id)
      if (error) throw error
      refetch()
    } catch (error) { alert('Gabim: ' + error.message) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Fshi këtë termin?')) return
    try {
      const { error } = await supabase.from('appointments').delete().eq('id', id)
      if (error) throw error
      setIsModalOpen(false)
      refetch()
    } catch (error) { alert('Gabim: ' + error.message) }
  }

  // Inline add client → select it in the appointment form
  const handleAddClient = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { data, error } = await supabase.from('clients').insert([clientForm]).select().single()
      if (error) throw error
      await refetchClients()
      setFormData(f => ({ ...f, client_id: String(data.id), phone: clientForm.phone || f.phone }))
      setIsClientModalOpen(false)
      setClientForm(emptyClient)
    } catch (error) { alert('Gabim: ' + error.message) }
    finally { setSubmitting(false) }
  }

  // Inline add car (for the selected client) → select it in the appointment form
  const handleAddCar = async (e) => {
    e.preventDefault()
    if (!formData.client_id) { alert('Zgjidh klientin fillimisht.'); return }
    setSubmitting(true)
    try {
      const data = {
        client_id: parseInt(formData.client_id),
        make: carForm.make.trim(),
        model: carForm.model.trim(),
        year: carForm.year ? parseInt(carForm.year) : null,
        color: carForm.color.trim() || null,
        license_plate: carForm.license_plate.trim().toUpperCase(),
        vin: carForm.vin.trim().toUpperCase() || null,
      }
      const { data: inserted, error } = await supabase.from('cars').insert([data]).select().single()
      if (error) throw error
      await refetchCars()
      setFormData(f => ({ ...f, car_id: String(inserted.id) }))
      setIsCarModalOpen(false)
      setCarForm(emptyCar())
    } catch (error) { alert('Gabim: ' + error.message) }
    finally { setSubmitting(false) }
  }

  if (loading) return <Loading />

  const monthLabel = MONTHS[cursor.month] + ' ' + cursor.year
  const today = todayISO()

  return (
    <div className="space-y-5">
      {/* Header / toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-display text-dark-500">Terminet</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday}>Sot</Button>
          <button onClick={goPrev} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={goNext} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"><ChevronRight className="w-4 h-4" /></button>
          <span className="text-base sm:text-lg font-semibold text-dark-500 min-w-[140px] text-center">{monthLabel}</span>
          <Button onClick={() => openCreate(today)} className="flex items-center gap-2"><Plus className="w-4 h-4" /> <span className="hidden sm:inline">Termin i Ri</span></Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-600">
        {STATUS_ORDER.map(s => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-sm ${STATUSES[s].chip.split(' ')[0]}`} /> {STATUSES[s].label}
          </span>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
        {/* Weekday header */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {WEEKDAYS.map(d => (
            <div key={d} className="px-2 py-2 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">{d}</div>
          ))}
        </div>
        {/* Weeks */}
        <div>
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b border-gray-100 last:border-b-0">
              {week.map((day) => {
                const iso = isoOf(day)
                const inMonth = day.getMonth() === cursor.month
                const isToday = iso === today
                const dayAppts = byDate[iso] || []
                return (
                  <div
                    key={iso}
                    onClick={() => openCreate(iso)}
                    className={`min-h-[96px] sm:min-h-[120px] border-r border-gray-100 last:border-r-0 p-1.5 cursor-pointer transition-colors hover:bg-primary-50/40 ${inMonth ? 'bg-white' : 'bg-gray-50/60'}`}
                  >
                    <div className="flex justify-end">
                      <span className={`inline-flex items-center justify-center text-xs w-6 h-6 rounded-full ${
                        isToday ? 'bg-primary-400 text-white font-bold' : inMonth ? 'text-gray-600' : 'text-gray-300'
                      }`}>{day.getDate()}</span>
                    </div>
                    <div className="mt-1 space-y-1">
                      {dayAppts.slice(0, 3).map(a => (
                        <button
                          key={a.id}
                          onClick={(e) => { e.stopPropagation(); openEdit(a) }}
                          title={displayName(a) + (a.service_description ? ' — ' + a.service_description : '')}
                          className={`w-full text-left text-[11px] leading-tight text-white rounded px-1.5 py-1 truncate transition-colors ${STATUSES[a.status]?.chip || 'bg-gray-400'}`}
                        >
                          {a.appointment_time && <span className="font-semibold mr-1">{formatTime(a.appointment_time)}</span>}
                          {displayName(a)}
                        </button>
                      ))}
                      {dayAppts.length > 3 && (
                        <div className="text-[10px] text-gray-500 font-medium pl-1">+{dayAppts.length - 3} të tjera</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Create / Edit appointment modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Ndrysho Terminin' : 'Termin i Ri'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Data" type="date" value={formData.appointment_date}
              onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })} required />
            <Input label="Ora" type="time" value={formData.appointment_time}
              onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })} />
            <Select label="Statusi" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} required>
              {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUSES[s].label}</option>)}
            </Select>
          </div>

          <div className="border-t pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SearchableSelect label="Klienti" value={formData.client_id}
              onChange={handleClientChange} required
              placeholder="Kërko klientin..."
              options={clients.map(c => ({ value: c.id, label: c.full_name, sub: c.phone }))}
              onAdd={() => { setClientForm(emptyClient); setIsClientModalOpen(true) }}
              addLabel="Shto klient të ri" />
            <SearchableSelect label="Automjeti" value={formData.car_id}
              onChange={(val) => setFormData({ ...formData, car_id: val })}
              placeholder={formData.client_id ? (clientCars.length ? "Kërko automjetin..." : "Nuk ka automjete — shto një") : "Zgjidh klientin fillimisht"}
              options={clientCars.map(c => ({ value: c.id, label: c.make + ' ' + c.model + ' (' + c.license_plate + ')' }))}
              onAdd={formData.client_id ? () => { setCarForm(emptyCar()); setIsCarModalOpen(true) } : undefined}
              addLabel="Shto automjet të ri" />
          </div>

          <div className="border-t pt-4 space-y-3">
            <TextArea label="Shërbimi i kërkuar" value={formData.service_description}
              onChange={(e) => setFormData({ ...formData, service_description: e.target.value })} placeholder="p.sh., Ndërrim vaji, kontroll frenash" rows={2} />
            <TextArea label="Shënime (opsional)" value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Shënime shtesë" rows={2} />
          </div>

          {/* Quick status actions when editing */}
          {editing && (editing.status === 'scheduled' || editing.status === 'confirmed') && (
            <div className="flex flex-wrap gap-2 border-t pt-4">
              {editing.status === 'scheduled' && (
                <Button type="button" variant="outline" size="sm" onClick={() => updateStatus(editing.id, 'confirmed')} className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-blue-600" /> Konfirmo
                </Button>
              )}
              <Button type="button" variant="success" size="sm" onClick={() => updateStatus(editing.id, 'completed')} className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Përfundo
              </Button>
              <Button type="button" variant="danger" size="sm" onClick={() => updateStatus(editing.id, 'cancelled')} className="flex items-center gap-1">
                <XCircle className="w-4 h-4" /> Anulo
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-3 border-t">
            <div>
              {editing && (
                <Button type="button" variant="danger" onClick={() => handleDelete(editing.id)} className="flex items-center gap-1">
                  <Trash2 className="w-4 h-4" /> Fshi
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Anulo</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Duke ruajtur...' : editing ? 'Përditëso' : 'Cakto Terminin'}</Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Inline Add Client modal */}
      <Modal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} title="Shto Klient të Ri" size="sm">
        <form onSubmit={handleAddClient} className="space-y-4">
          <Input label="Emri i Plotë" value={clientForm.full_name} onChange={(e) => setClientForm({ ...clientForm, full_name: e.target.value })} required autoFocus />
          <Input label="Telefoni" type="tel" value={clientForm.phone} onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })} required />
          <Input label="Email" type="email" value={clientForm.email} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })} />
          <Input label="Adresa" value={clientForm.address} onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })} />
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setIsClientModalOpen(false)}>Anulo</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Duke ruajtur...' : 'Shto Klientin'}</Button>
          </div>
        </form>
      </Modal>

      {/* Inline Add Car modal */}
      <Modal isOpen={isCarModalOpen} onClose={() => setIsCarModalOpen(false)} title="Shto Automjet të Ri" size="sm">
        <form onSubmit={handleAddCar} className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-2.5 text-sm text-gray-600 flex items-center gap-2">
            <CarIcon className="w-4 h-4 text-gray-400" />
            Për: <span className="font-medium text-dark-500">{clients.find(c => String(c.id) === String(formData.client_id))?.full_name || '—'}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Marka" value={carForm.make} onChange={(e) => setCarForm({ ...carForm, make: e.target.value })} required autoFocus />
            <Input label="Modeli" value={carForm.model} onChange={(e) => setCarForm({ ...carForm, model: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Viti" type="number" value={carForm.year} onChange={(e) => setCarForm({ ...carForm, year: e.target.value })} />
            <Input label="Ngjyra" value={carForm.color} onChange={(e) => setCarForm({ ...carForm, color: e.target.value })} />
          </div>
          <Input label="Targa" value={carForm.license_plate} onChange={(e) => setCarForm({ ...carForm, license_plate: e.target.value })} required />
          <Input label="VIN (opsional)" value={carForm.vin} onChange={(e) => setCarForm({ ...carForm, vin: e.target.value })} />
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setIsCarModalOpen(false)}>Anulo</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Duke ruajtur...' : 'Shto Automjetin'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

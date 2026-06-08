import { useState, useMemo, useEffect } from 'react'
import { Plus, Trash2, Edit2, Calendar, X, CalendarClock, CalendarCheck, CalendarDays, Clock, CheckCircle, XCircle, Phone } from 'lucide-react'
import { Card, StatCard } from '../components/Card'
import { Button } from '../components/Button'
import { Input, Select, TextArea } from '../components/Input'
import { Modal } from '../components/Modal'
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell, Badge } from '../components/Table'
import { Loading, EmptyState } from '../components/Loading'
import { Pagination, paginate, usePagination } from '../components/Pagination'
import { SearchableSelect } from '../components/SearchableSelect'
import { useAppointments, useClients, useCars } from '../hooks/useData'
import { formatDate } from '../utils/helpers'
import { supabase } from '../services/supabase'

// Status definitions (Albanian labels)
const STATUSES = {
  scheduled: { label: 'Caktuar', variant: 'warning' },
  confirmed: { label: 'Konfirmuar', variant: 'info' },
  completed: { label: 'Përfunduar', variant: 'success' },
  cancelled: { label: 'Anuluar', variant: 'danger' },
}
const STATUS_ORDER = ['scheduled', 'confirmed', 'completed', 'cancelled']

const todayISO = () => {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

const formatTime = (t) => {
  if (!t) return ''
  // t comes as 'HH:MM:SS' — show HH:MM
  return String(t).slice(0, 5)
}

const emptyForm = () => ({
  client_id: '', car_id: '', customer_name: '', phone: '', vehicle_info: '',
  appointment_date: todayISO(), appointment_time: '', service_description: '', status: 'scheduled', notes: '',
})

export const Appointments = () => {
  const { appointments, loading, refetch } = useAppointments()
  const { clients } = useClients()
  const { cars } = useCars()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState(emptyForm())
  const [submitting, setSubmitting] = useState(false)
  const [page, setPage] = useState(1)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const clientCars = useMemo(
    () => formData.client_id ? cars.filter(c => c.client_id === parseInt(formData.client_id)) : [],
    [formData.client_id, cars]
  )

  const filtered = useMemo(() => {
    let result = appointments
    if (dateFrom) result = result.filter(a => a.appointment_date >= dateFrom)
    if (dateTo) result = result.filter(a => a.appointment_date <= dateTo)
    if (statusFilter !== 'all') result = result.filter(a => a.status === statusFilter)
    return result
  }, [appointments, dateFrom, dateTo, statusFilter])

  useEffect(() => { setPage(1) }, [dateFrom, dateTo, statusFilter])

  const stats = useMemo(() => {
    const today = todayISO()
    const isOpen = (a) => a.status === 'scheduled' || a.status === 'confirmed'
    return {
      today: appointments.filter(a => a.appointment_date === today && isOpen(a)).length,
      upcoming: appointments.filter(a => a.appointment_date > today && isOpen(a)).length,
      pending: appointments.filter(a => a.status === 'scheduled').length,
      completed: appointments.filter(a => a.status === 'completed').length,
    }
  }, [appointments])

  const { totalPages } = usePagination(filtered)
  const paginated = paginate(filtered, page)

  const displayName = (a) => a.clients?.full_name || a.customer_name || '—'
  const displayPhone = (a) => a.clients?.phone || a.phone || ''
  const displayVehicle = (a) => {
    if (a.cars) return a.cars.make + ' ' + a.cars.model + (a.cars.license_plate ? ' (' + a.cars.license_plate + ')' : '')
    return a.vehicle_info || ''
  }

  const handleOpenModal = (appt = null) => {
    if (appt) {
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
    } else {
      setEditing(null)
      setFormData(emptyForm())
    }
    setIsModalOpen(true)
  }

  const handleClientChange = (val) => {
    const client = clients.find(c => String(c.id) === String(val))
    setFormData(f => ({
      ...f,
      client_id: val,
      car_id: '',
      // prefill phone from client record (keep manual entry if client cleared)
      phone: client ? (client.phone || '') : f.phone,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        client_id: formData.client_id ? parseInt(formData.client_id) : null,
        car_id: formData.car_id ? parseInt(formData.car_id) : null,
        customer_name: formData.client_id ? null : (formData.customer_name.trim() || null),
        phone: formData.phone.trim() || null,
        vehicle_info: formData.car_id ? null : (formData.vehicle_info.trim() || null),
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
      refetch()
    } catch (error) { alert('Gabim: ' + error.message) }
  }

  const hasFilters = dateFrom || dateTo || statusFilter !== 'all'
  const clearFilters = () => { setDateFrom(''); setDateTo(''); setStatusFilter('all') }

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-4xl font-display text-dark-500 mb-1 sm:mb-2">Terminet</h1>
          <p className="text-sm text-gray-600">Menaxho terminet e klientëve për servisime</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2"><Plus className="w-5 h-5" /> Termin i Ri</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard label="Sot" value={stats.today} icon={CalendarClock} color="primary" />
        <StatCard label="Të ardhshme" value={stats.upcoming} icon={CalendarDays} color="warning" />
        <StatCard label="Në pritje" value={stats.pending} icon={Clock} color="warning" />
        <StatCard label="Përfunduar" value={stats.completed} icon={CalendarCheck} color="success" />
      </div>

      <Card className="!p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600"><Calendar className="w-4 h-4" /> Filtro:</div>
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
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Statusi</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all text-sm bg-white">
              <option value="all">Të gjitha</option>
              {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUSES[s].label}</option>)}
            </select>
          </div>
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="flex items-center gap-1 h-[38px]">
              <X className="w-4 h-4" /> Pastro
            </Button>
          )}
          <span className="text-sm text-gray-500 ml-2">{filtered.length} termine</span>
        </div>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState title={hasFilters ? "Asnjë termin në këto filtra" : "Nuk ka termine ende"} description={hasFilters ? "Provo të ndryshosh filtrat" : "Cakto terminin e parë për të nisur"}
            action={!hasFilters && <Button onClick={() => handleOpenModal()}><Plus className="w-5 h-5 mr-2" />Termin i Ri</Button>} />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableHeaderCell>Data & Ora</TableHeaderCell>
                <TableHeaderCell>Klienti</TableHeaderCell>
                <TableHeaderCell>Automjeti</TableHeaderCell>
                <TableHeaderCell>Shërbimi</TableHeaderCell>
                <TableHeaderCell>Statusi</TableHeaderCell>
                <TableHeaderCell>Veprime</TableHeaderCell>
              </TableHeader>
              <TableBody>
                {paginated.map((appt) => (
                  <TableRow key={appt.id}>
                    <TableCell>
                      <span className="font-medium text-dark-500">{formatDate(appt.appointment_date + 'T12:00:00')}</span>
                      {appt.appointment_time && <span className="block text-xs text-gray-500 font-mono">{formatTime(appt.appointment_time)}</span>}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-dark-500">{displayName(appt)}</span>
                      {displayPhone(appt) && <span className="flex items-center gap-1 text-xs text-gray-400"><Phone className="w-3 h-3" />{displayPhone(appt)}</span>}
                    </TableCell>
                    <TableCell><span className="text-sm text-gray-600">{displayVehicle(appt) || '—'}</span></TableCell>
                    <TableCell><span className="text-sm text-gray-600">{appt.service_description || '—'}</span></TableCell>
                    <TableCell><Badge variant={STATUSES[appt.status]?.variant || 'default'}>{STATUSES[appt.status]?.label || appt.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        {appt.status === 'scheduled' && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus(appt.id, 'confirmed')} title="Konfirmo">
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                          </Button>
                        )}
                        {(appt.status === 'scheduled' || appt.status === 'confirmed') && (
                          <>
                            <Button size="sm" variant="success" onClick={() => updateStatus(appt.id, 'completed')} title="Shëno si përfunduar">
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => updateStatus(appt.id, 'cancelled')} title="Anulo">
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="outline" onClick={() => handleOpenModal(appt)} title="Ndrysho">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(appt.id)} title="Fshi">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} />
          </>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Ndrysho Terminin' : 'Termin i Ri'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Data" type="date" value={formData.appointment_date}
              onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })} required />
            <Input label="Ora" type="time" value={formData.appointment_time}
              onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })} />
          </div>

          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Klienti</p>
            <SearchableSelect label="Klient ekzistues (opsional)" value={formData.client_id}
              onChange={handleClientChange}
              placeholder="Kërko klientin..."
              options={clients.map(c => ({ value: c.id, label: c.full_name, sub: c.phone }))} />

            {!formData.client_id && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <Input label="Emri i klientit" value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} placeholder="p.sh., Klient i ri" />
                <Input label="Telefoni" value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="p.sh., 044 123 456" />
              </div>
            )}
            {formData.client_id && (
              <div className="mt-3">
                <Input label="Telefoni" value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Telefoni" />
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Automjeti</p>
            {formData.client_id && clientCars.length > 0 ? (
              <SearchableSelect label="Automjeti i klientit (opsional)" value={formData.car_id}
                onChange={(val) => setFormData({ ...formData, car_id: val })}
                placeholder="Kërko automjetin..."
                options={clientCars.map(c => ({ value: c.id, label: c.make + ' ' + c.model + ' (' + c.license_plate + ')' }))} />
            ) : (
              <Input label="Automjeti (opsional)" value={formData.vehicle_info}
                onChange={(e) => setFormData({ ...formData, vehicle_info: e.target.value })} placeholder="p.sh., Golf 7, Targa AA-123-BB" />
            )}
          </div>

          <div className="border-t pt-4 space-y-3">
            <TextArea label="Shërbimi i kërkuar" value={formData.service_description}
              onChange={(e) => setFormData({ ...formData, service_description: e.target.value })} placeholder="p.sh., Ndërrim vaji, kontroll frenash" rows={2} />
            <Select label="Statusi" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} required>
              {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUSES[s].label}</option>)}
            </Select>
            <TextArea label="Shënime (opsional)" value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Shënime shtesë" rows={2} />
          </div>

          <div className="flex gap-3 justify-end pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Anulo</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Duke ruajtur...' : editing ? 'Përditëso' : 'Cakto Terminin'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

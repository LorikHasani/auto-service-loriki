import { useState, useMemo, useEffect } from 'react'
import { Plus, Trash2, Edit2, Search } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Modal } from '../components/Modal'
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/Table'
import { Loading, EmptyState } from '../components/Loading'
import { Pagination, paginate, usePagination } from '../components/Pagination'
import { SearchableSelect } from '../components/SearchableSelect'
import { useCars, useClients } from '../hooks/useData'
import { supabase } from '../services/supabase'

export const Vehicles = () => {
  const { cars, loading, refetch } = useCars()
  const { clients, refetch: refetchClients } = useClients()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [editingCar, setEditingCar] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const emptyForm = { client_id: '', make: '', model: '', year: new Date().getFullYear(), color: '', license_plate: '', vin: '' }
  const [formData, setFormData] = useState(emptyForm)
  const [clientForm, setClientForm] = useState({ full_name: '', phone: '', email: '', address: '' })
  const [submitting, setSubmitting] = useState(false)

  const filteredCars = useMemo(() => {
    if (!searchQuery.trim()) return cars
    const q = searchQuery.toLowerCase()
    return cars.filter(car => (car.clients?.full_name || '').toLowerCase().includes(q) || (car.license_plate || '').toLowerCase().includes(q) || (car.vin || '').toLowerCase().includes(q))
  }, [cars, searchQuery])

  useEffect(() => { setPage(1) }, [searchQuery])

  const { totalPages } = usePagination(filteredCars)
  const paginatedCars = paginate(filteredCars, page)

  const handleOpenModal = (car = null) => {
    if (car) { setEditingCar(car); setFormData({ client_id: car.client_id || '', make: car.make || '', model: car.model || '', year: car.year || new Date().getFullYear(), color: car.color || '', license_plate: car.license_plate || '', vin: car.vin || '' }) }
    else { setEditingCar(null); setFormData(emptyForm) }
    setIsModalOpen(true)
  }
  const handleCloseModal = () => { setIsModalOpen(false); setEditingCar(null); setFormData(emptyForm) }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      if (editingCar) { const { error } = await supabase.from('cars').update(formData).eq('id', editingCar.id); if (error) throw error }
      else { const { error } = await supabase.from('cars').insert([formData]); if (error) throw error }
      handleCloseModal(); refetch()
    } catch (error) { alert('Gabim: ' + error.message) }
    finally { setSubmitting(false) }
  }

  const handleAddClient = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      const { data, error } = await supabase.from('clients').insert([clientForm]).select().single()
      if (error) throw error
      await refetchClients()
      setFormData({ ...formData, client_id: String(data.id) })
      setIsClientModalOpen(false)
      setClientForm({ full_name: '', phone: '', email: '', address: '' })
    } catch (error) { alert('Gabim: ' + error.message) }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Fshi këtë automjet?')) return
    try { const { error } = await supabase.from('cars').delete().eq('id', id); if (error) throw error; refetch() }
    catch (error) { alert('Gabim: ' + error.message) }
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display text-dark-500 mb-2">Automjetet</h1>
          <p className="text-gray-600">Menaxho automjetet e klientëve</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2"><Plus className="w-5 h-5" /> Shto Automjet</Button>
      </div>

      {cars.length > 0 && (
        <Card className="!p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Kërko sipas klientit, targës ose VIN..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all text-sm" />
          </div>
          {searchQuery && <div className="mt-2 text-sm text-gray-500">Duke shfaqur {filteredCars.length} nga {cars.length} automjete</div>}
        </Card>
      )}

      <Card>
        {filteredCars.length === 0 ? (
          <EmptyState title={searchQuery ? "Asnjë automjet nuk përputhet" : "Nuk ka automjete ende"} description={searchQuery ? "Provo një kërkim tjetër" : "Shto automjetin e parë"}
            action={!searchQuery && <Button onClick={() => handleOpenModal()}><Plus className="w-5 h-5 mr-2" /> Shto Automjetin e Parë</Button>} />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableHeaderCell>Klienti</TableHeaderCell>
                <TableHeaderCell>Marka</TableHeaderCell>
                <TableHeaderCell>Modeli</TableHeaderCell>
                <TableHeaderCell>Viti</TableHeaderCell>
                <TableHeaderCell>Targa</TableHeaderCell>
                <TableHeaderCell>VIN</TableHeaderCell>
                <TableHeaderCell>Veprime</TableHeaderCell>
              </TableHeader>
              <TableBody>
                {paginatedCars.map((car) => (
                  <TableRow key={car.id}>
                    <TableCell><span className="font-medium">{car.clients?.full_name}</span></TableCell>
                    <TableCell>{car.make}</TableCell>
                    <TableCell>{car.model}</TableCell>
                    <TableCell>{car.year}</TableCell>
                    <TableCell><span className="font-mono font-medium">{car.license_plate}</span></TableCell>
                    <TableCell><span className="text-gray-600 text-sm font-mono">{car.vin || 'N/A'}</span></TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => handleOpenModal(car)}><Edit2 className="w-4 h-4" /></Button>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(car.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={filteredCars.length} />
          </>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingCar ? 'Ndrysho Automjetin' : 'Shto Automjet të Ri'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <SearchableSelect label="Klienti" value={formData.client_id}
            onChange={(val) => setFormData({ ...formData, client_id: val })} required
            placeholder="Kërko klientin..."
            options={clients.map(c => ({ value: c.id, label: c.full_name, sub: c.phone }))}
            onAdd={() => setIsClientModalOpen(true)}
            addLabel="Shto klient të ri" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Marka" value={formData.make} onChange={(e) => setFormData({ ...formData, make: e.target.value })} required />
            <Input label="Modeli" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Viti" type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} required />
            <Input label="Ngjyra" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
          </div>
          <Input label="Targa" value={formData.license_plate} onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })} required />
          <Input label="VIN" value={formData.vin} onChange={(e) => setFormData({ ...formData, vin: e.target.value })} />
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>Anulo</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Duke ruajtur...' : editingCar ? 'Përditëso' : 'Shto Automjetin'}</Button>
          </div>
        </form>
      </Modal>

      {/* Inline Add Client Modal */}
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
    </div>
  )
}

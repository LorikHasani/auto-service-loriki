import { useState } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Modal } from '../components/Modal'
import { Loading, EmptyState } from '../components/Loading'
import { Pagination, paginate, usePagination } from '../components/Pagination'
import { useServices } from '../hooks/useData'
import { supabase } from '../services/supabase'

export const Services = () => {
  const { services, loading, refetch } = useServices()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [formData, setFormData] = useState({ name: '' })
  const [submitting, setSubmitting] = useState(false)
  const [page, setPage] = useState(1)

  const { totalPages } = usePagination(services)
  const paginatedServices = paginate(services, page)

  const handleOpenModal = (service = null) => {
    if (service) { setEditingService(service); setFormData({ name: service.name }) }
    else { setEditingService(null); setFormData({ name: '' }) }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      const dataToSave = { name: formData.name, description: '', default_price: 0 }
      if (editingService) { const { error } = await supabase.from('services').update(dataToSave).eq('id', editingService.id); if (error) throw error }
      else { const { error } = await supabase.from('services').insert([dataToSave]); if (error) throw error }
      setIsModalOpen(false); setFormData({ name: '' }); setEditingService(null); refetch()
    } catch (error) { alert('Gabim: ' + error.message) }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Fshi këtë shërbim nga katalogu?')) return
    try { const { error } = await supabase.from('services').delete().eq('id', id); if (error) throw error; refetch() }
    catch (error) { alert('Gabim: ' + error.message) }
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-4xl font-display text-dark-500 mb-1 sm:mb-2">Katalogu i Shërbimeve</h1>
          <p className="text-sm sm:text-base text-gray-600">Menaxho emrat e shërbimeve</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2 self-start"><Plus className="w-5 h-5" /> Shto Shërbim</Button>
      </div>

      <Card>
        {services.length === 0 ? (
          <EmptyState title="Nuk ka shërbime ende" description="Shto emra shërbimesh për krijim të shpejtë porosish"
            action={<Button onClick={() => handleOpenModal()}><Plus className="w-5 h-5 mr-2" /> Shto Shërbimin e Parë</Button>} />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedServices.map((service) => (
                <div key={service.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-400 transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-dark-500">{service.name}</span>
                    <div className="flex gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(service)} className="p-1 hover:bg-gray-200 rounded"><Edit2 className="w-4 h-4 text-gray-600" /></button>
                      <button onClick={() => handleDelete(service.id)} className="p-1 hover:bg-red-100 rounded"><Trash2 className="w-4 h-4 text-red-600" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={services.length} />
          </>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingService ? 'Ndrysho Shërbimin' : 'Shto Shërbim të Ri'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Emri i Shërbimit" value={formData.name} onChange={(e) => setFormData({ name: e.target.value })} placeholder="p.sh., Ndërrimi i Vajit" required autoFocus />
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Anulo</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Duke ruajtur...' : editingService ? 'Përditëso' : 'Shto'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

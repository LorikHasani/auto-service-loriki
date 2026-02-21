import { useState } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Modal } from '../components/Modal'
import { Loading, EmptyState } from '../components/Loading'
import { Pagination, paginate, usePagination } from '../components/Pagination'
import { useEmployees } from '../hooks/useData'
import { supabase } from '../services/supabase'

export const Employees = () => {
  const { employees, loading, refetch } = useEmployees()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [formData, setFormData] = useState({ name: '' })
  const [submitting, setSubmitting] = useState(false)
  const [page, setPage] = useState(1)

  const { totalPages } = usePagination(employees)
  const paginatedEmployees = paginate(employees, page)

  const handleOpenModal = (employee = null) => {
    if (employee) { setEditingEmployee(employee); setFormData({ name: employee.name }) }
    else { setEditingEmployee(null); setFormData({ name: '' }) }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      if (editingEmployee) { const { error } = await supabase.from('employees').update({ name: formData.name }).eq('id', editingEmployee.id); if (error) throw error }
      else { const { error } = await supabase.from('employees').insert([{ name: formData.name }]); if (error) throw error }
      setIsModalOpen(false); setFormData({ name: '' }); setEditingEmployee(null); refetch()
    } catch (error) { alert('Gabim: ' + error.message) }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Fshi këtë punonjës?')) return
    try { const { error } = await supabase.from('employees').delete().eq('id', id); if (error) throw error; refetch() }
    catch (error) { alert('Gabim: ' + error.message) }
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-4xl font-display text-dark-500 mb-2">Punonjësit</h1>
          <p className="text-gray-600">Menaxho punonjësit e servisit</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2"><Plus className="w-5 h-5" /> Shto Punonjës</Button>
      </div>

      <Card>
        {employees.length === 0 ? (
          <EmptyState title="Nuk ka punonjës ende" description="Shto punonjësit për t'i caktuar në porosi"
            action={<Button onClick={() => handleOpenModal()}><Plus className="w-5 h-5 mr-2" />Shto Punonjësin e Parë</Button>} />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedEmployees.map((emp) => (
                <div key={emp.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-400 transition-all group">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="font-medium text-dark-500">{emp.name}</span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(emp)} className="p-1 hover:bg-gray-200 rounded"><Edit2 className="w-4 h-4 text-gray-600" /></button>
                      <button onClick={() => handleDelete(emp.id)} className="p-1 hover:bg-red-100 rounded"><Trash2 className="w-4 h-4 text-red-600" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={employees.length} />
          </>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingEmployee ? 'Ndrysho Punonjësin' : 'Shto Punonjës'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Emri i Punonjësit" value={formData.name} onChange={(e) => setFormData({ name: e.target.value })} placeholder="p.sh., Filan Fisteku" required autoFocus />
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Anulo</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Duke ruajtur...' : editingEmployee ? 'Përditëso' : 'Shto'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

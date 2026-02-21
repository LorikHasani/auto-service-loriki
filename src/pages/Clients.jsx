import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Edit2, Search, Eye } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Modal } from '../components/Modal'
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/Table'
import { Loading, EmptyState } from '../components/Loading'
import { Pagination, paginate, usePagination } from '../components/Pagination'
import { useClients } from '../hooks/useData'
import { supabase } from '../services/supabase'

export const Clients = () => {
  const { clients, loading, refetch } = useClients()
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({ full_name: '', phone: '', email: '', address: '' })
  const [submitting, setSubmitting] = useState(false)
  const [page, setPage] = useState(1)

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients
    const q = searchQuery.toLowerCase()
    return clients.filter(c => (c.full_name || '').toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q))
  }, [clients, searchQuery])

  useEffect(() => { setPage(1) }, [searchQuery])

  const { totalPages } = usePagination(filteredClients)
  const paginatedClients = paginate(filteredClients, page)

  const handleOpenModal = (client = null) => {
    if (client) { setEditingClient(client); setFormData({ full_name: client.full_name || '', phone: client.phone || '', email: client.email || '', address: client.address || '' }) }
    else { setEditingClient(null); setFormData({ full_name: '', phone: '', email: '', address: '' }) }
    setIsModalOpen(true)
  }
  const handleCloseModal = () => { setIsModalOpen(false); setEditingClient(null); setFormData({ full_name: '', phone: '', email: '', address: '' }) }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      if (editingClient) { const { error } = await supabase.from('clients').update(formData).eq('id', editingClient.id); if (error) throw error }
      else { const { error } = await supabase.from('clients').insert([formData]); if (error) throw error }
      handleCloseModal(); refetch()
    } catch (error) { alert('Gabim: ' + error.message) }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Fshi këtë klient? Kjo do të fshijë edhe automjetet dhe porositë.')) return
    try { const { error } = await supabase.from('clients').delete().eq('id', id); if (error) throw error; refetch() }
    catch (error) { alert('Gabim: ' + error.message) }
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-4xl font-display text-dark-500 mb-2">Klientët</h1>
          <p className="text-gray-600">Menaxho bazën e klientëve</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2"><Plus className="w-5 h-5" /> Shto Klient</Button>
      </div>

      {clients.length > 0 && (
        <Card className="!p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Kërko sipas emrit ose numrit të telefonit..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all text-sm" />
          </div>
          {searchQuery && <div className="mt-2 text-sm text-gray-500">Duke shfaqur {filteredClients.length} nga {clients.length} klientë</div>}
        </Card>
      )}

      <Card>
        {filteredClients.length === 0 ? (
          <EmptyState title={searchQuery ? "Asnjë klient nuk përputhet" : "Nuk ka klientë ende"} description={searchQuery ? "Provo një kërkim tjetër" : "Fillo duke shtuar klientin e parë"}
            action={!searchQuery && <Button onClick={() => handleOpenModal()} className="flex items-center gap-2"><Plus className="w-5 h-5" /> Shto Klientin e Parë</Button>} />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableHeaderCell>Emri</TableHeaderCell>
                <TableHeaderCell>Telefoni</TableHeaderCell>
                <TableHeaderCell>Email</TableHeaderCell>
                <TableHeaderCell>Adresa</TableHeaderCell>
                <TableHeaderCell>Veprime</TableHeaderCell>
              </TableHeader>
              <TableBody>
                {paginatedClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell><span className="font-medium text-dark-500">{client.full_name}</span></TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell><span className="text-gray-600">{client.address || 'N/A'}</span></TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <Button variant="primary" size="sm" onClick={() => navigate('/clients/' + client.id)} className="flex items-center gap-1"><Eye className="w-4 h-4" /> Shiko</Button>
                        <Button variant="secondary" size="sm" onClick={() => handleOpenModal(client)}><Edit2 className="w-4 h-4" /></Button>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(client.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={filteredClients.length} />
          </>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingClient ? 'Ndrysho Klientin' : 'Shto Klient të Ri'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Emri i Plotë" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required />
          <Input label="Telefoni" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
          <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          <Input label="Adresa" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>Anulo</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Duke ruajtur...' : editingClient ? 'Përditëso' : 'Shto Klientin'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

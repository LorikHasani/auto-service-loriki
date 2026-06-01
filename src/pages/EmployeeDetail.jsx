import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Edit2, Wallet, Car, Calendar, UserCog } from 'lucide-react'
import { Card, StatCard } from '../components/Card'
import { Button } from '../components/Button'
import { Input, TextArea } from '../components/Input'
import { Modal } from '../components/Modal'
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell, Badge } from '../components/Table'
import { Loading, EmptyState } from '../components/Loading'
import { Pagination, paginate, usePagination } from '../components/Pagination'
import { useSalaries, useOrders } from '../hooks/useData'
import { formatCurrency, formatDate } from '../utils/helpers'
import { supabase } from '../services/supabase'

const todayISO = () => {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

export const EmployeeDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const { salaries, loading: salariesLoading, refetch: refetchSalaries } = useSalaries()
  const { orders, loading: ordersLoading } = useOrders(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({ payment_date: todayISO(), amount: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [salaryPage, setSalaryPage] = useState(1)
  const [orderPage, setOrderPage] = useState(1)

  useEffect(() => {
    const fetchEmployee = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase.from('employees').select('*').eq('id', id).single()
        if (error) throw error
        setEmployee(data)
      } catch (error) {
        alert('Gabim duke ngarkuar: ' + error.message)
        navigate('/employees')
      } finally { setLoading(false) }
    }
    fetchEmployee()
  }, [id, navigate])

  const employeeSalaries = useMemo(() => salaries.filter(s => String(s.employee_id) === String(id)), [salaries, id])
  const employeeOrders = useMemo(() => {
    if (!employee) return []
    return orders.filter(o => o.employee_name && o.employee_name === employee.name)
  }, [orders, employee])

  const totalPaid = useMemo(() => employeeSalaries.reduce((s, p) => s + parseFloat(p.amount || 0), 0), [employeeSalaries])
  const lastPayment = employeeSalaries[0] || null

  const { totalPages: salaryPages } = usePagination(employeeSalaries)
  const paginatedSalaries = paginate(employeeSalaries, salaryPage)

  const { totalPages: orderPages } = usePagination(employeeOrders)
  const paginatedOrders = paginate(employeeOrders, orderPage)

  const handleOpenModal = (sal = null) => {
    if (sal) {
      setEditing(sal)
      setFormData({ payment_date: sal.payment_date, amount: String(sal.amount), notes: sal.notes || '' })
    } else {
      setEditing(null)
      setFormData({ payment_date: todayISO(), amount: '', notes: '' })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        payment_date: formData.payment_date,
        employee_id: parseInt(id, 10),
        amount: parseFloat(formData.amount) || 0,
        notes: formData.notes.trim() || null
      }
      if (editing) {
        const { error } = await supabase.from('salary_payments').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('salary_payments').insert([payload])
        if (error) throw error
      }
      setIsModalOpen(false)
      refetchSalaries()
    } catch (error) { alert('Gabim: ' + error.message) }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (sid) => {
    if (!confirm('Fshi këtë pagesë?')) return
    try {
      const { error } = await supabase.from('salary_payments').delete().eq('id', sid)
      if (error) throw error
      refetchSalaries()
    } catch (error) { alert('Gabim: ' + error.message) }
  }

  if (loading || salariesLoading || ordersLoading) return <Loading />
  if (!employee) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/employees')} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Kthehu
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
            <UserCog className="w-6 h-6 text-primary-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-display text-dark-500">{employee.name}</h1>
            <p className="text-gray-600">Profili i punonjësit</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard label="Vetura të Rregulluara" value={employeeOrders.length} icon={Car} color="primary" />
        <StatCard label="Pagesa" value={employeeSalaries.length} icon={Calendar} color="success" />
        <StatCard label="Totali Paguar" value={formatCurrency(totalPaid)} icon={Wallet} color="warning" />
        <StatCard label="Pagesa e Fundit" value={lastPayment ? formatCurrency(parseFloat(lastPayment.amount)) : '—'} icon={Wallet} color="primary" />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display text-dark-500">Historia e Rrogave</h2>
          <Button onClick={() => handleOpenModal()} className="flex items-center gap-2" size="sm">
            <Plus className="w-4 h-4" /> Shto Pagesë
          </Button>
        </div>
        {employeeSalaries.length === 0 ? (
          <EmptyState title="Nuk ka pagesa ende" description="Regjistro pagesën e parë të rrogës"
            action={<Button onClick={() => handleOpenModal()}><Plus className="w-5 h-5 mr-2" />Shto Pagesë</Button>} />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableHeaderCell>Data</TableHeaderCell>
                <TableHeaderCell>Shuma</TableHeaderCell>
                <TableHeaderCell>Shënim</TableHeaderCell>
                <TableHeaderCell>Veprime</TableHeaderCell>
              </TableHeader>
              <TableBody>
                {paginatedSalaries.map((sal) => (
                  <TableRow key={sal.id}>
                    <TableCell><span className="text-sm text-gray-600">{formatDate(sal.payment_date + 'T12:00:00')}</span></TableCell>
                    <TableCell><span className="font-semibold text-primary-600">{formatCurrency(parseFloat(sal.amount))}</span></TableCell>
                    <TableCell><span className="text-sm text-gray-600">{sal.notes || '—'}</span></TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenModal(sal)} className="p-1.5 hover:bg-gray-100 rounded"><Edit2 className="w-4 h-4 text-gray-600" /></button>
                        <button onClick={() => handleDelete(sal.id)} className="p-1.5 hover:bg-red-100 rounded"><Trash2 className="w-4 h-4 text-red-600" /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination currentPage={salaryPage} totalPages={salaryPages} onPageChange={setSalaryPage} totalItems={employeeSalaries.length} />
          </>
        )}
      </Card>

      <Card>
        <h2 className="text-xl font-display text-dark-500 mb-4">Vetura të Rregulluara ({employeeOrders.length})</h2>
        {employeeOrders.length === 0 ? (
          <EmptyState title="Nuk ka porosi" description="Ky punonjës nuk është caktuar ende në asnjë porosi" />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableHeaderCell>ID</TableHeaderCell>
                <TableHeaderCell>Klienti</TableHeaderCell>
                <TableHeaderCell>Automjeti</TableHeaderCell>
                <TableHeaderCell>Targa</TableHeaderCell>
                <TableHeaderCell>Data</TableHeaderCell>
                <TableHeaderCell>Statusi</TableHeaderCell>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell><span className="font-mono font-semibold text-dark-500">#{order.id}</span></TableCell>
                    <TableCell><span className="font-medium">{order.clients?.full_name || 'N/A'}</span></TableCell>
                    <TableCell><span className="text-gray-600">{order.cars?.make} {order.cars?.model}</span></TableCell>
                    <TableCell><span className="font-mono text-xs text-gray-500">{order.cars?.license_plate || '—'}</span></TableCell>
                    <TableCell><span className="text-gray-600">{formatDate(order.created_at)}</span></TableCell>
                    <TableCell><Badge variant={order.is_paid ? 'success' : 'danger'}>{order.is_paid ? 'Paguar' : 'Pa paguar'}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination currentPage={orderPage} totalPages={orderPages} onPageChange={setOrderPage} totalItems={employeeOrders.length} />
          </>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Ndrysho Pagesën' : 'Shto Pagesë Rroge'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Data" type="date" value={formData.payment_date} onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })} required />
          <Input label="Shuma (€)" type="number" step="0.01" min="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" required />
          <TextArea label="Shënim (opsional)" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="p.sh., Rroga e marsit" rows={3} />
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Anulo</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Duke ruajtur...' : editing ? 'Përditëso' : 'Shto'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

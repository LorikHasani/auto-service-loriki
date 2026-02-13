import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Car, Phone, Mail, MapPin, Printer, Calendar } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Modal } from '../components/Modal'
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell, Badge } from '../components/Table'
import { Loading, EmptyState } from '../components/Loading'
import { Pagination, paginate, usePagination } from '../components/Pagination'
import { formatCurrency, calculateOrderTotal, formatDate } from '../utils/helpers'
import { printOrderDocument } from '../utils/printOrder'
import { supabase } from '../services/supabase'

export const ClientDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [clientCars, setClientCars] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCarId, setSelectedCarId] = useState('all')
  const [page, setPage] = useState(1)

  // Print modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const [printOrderData, setPrintOrderData] = useState(null)
  const [printShowPrices, setPrintShowPrices] = useState(true)
  const [printShowOrderNo, setPrintShowOrderNo] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const { data: clientData, error: clientError } = await supabase.from('clients').select('*').eq('id', id).single()
        if (clientError) throw clientError
        setClient(clientData)

        const { data: carsData, error: carsError } = await supabase.from('cars').select('*').eq('client_id', id).order('created_at', { ascending: false })
        if (carsError) throw carsError
        setClientCars(carsData || [])

        const { data: ordersData, error: ordersError } = await supabase.from('orders')
          .select('*, clients(full_name, phone, email), cars(make, model, license_plate, vin), order_items(*)')
          .eq('client_id', id).order('created_at', { ascending: false })
        if (ordersError) throw ordersError
        setOrders(ordersData || [])
      } catch (error) {
        alert('Gabim duke ngarkuar: ' + error.message)
        navigate('/clients')
      } finally { setLoading(false) }
    }
    fetchData()
  }, [id, navigate])

  const filteredOrders = useMemo(() => {
    if (selectedCarId === 'all') return orders
    return orders.filter(o => String(o.car_id) === String(selectedCarId))
  }, [orders, selectedCarId])

  useEffect(() => { setPage(1) }, [selectedCarId])

  const { totalPages } = usePagination(filteredOrders)
  const paginatedOrders = paginate(filteredOrders, page)

  const totalSpent = useMemo(() => filteredOrders.reduce((sum, o) => sum + calculateOrderTotal(o), 0), [filteredOrders])
  const totalOrders = filteredOrders.length
  const paidOrders = filteredOrders.filter(o => o.is_paid).length
  const unpaidOrders = filteredOrders.filter(o => !o.is_paid).length

  const openPrintModal = (order) => {
    setPrintOrderData(order)
    setPrintShowPrices(true)
    setPrintShowOrderNo(true)
    setIsPrintModalOpen(true)
  }

  const executePrint = () => {
    if (!printOrderData) return
    printOrderDocument(printOrderData, { showPrices: printShowPrices, showOrderNo: printShowOrderNo })
    setIsPrintModalOpen(false)
  }

  if (loading) return <Loading />
  if (!client) return null

  const selectedCar = selectedCarId !== 'all' ? clientCars.find(c => String(c.id) === String(selectedCarId)) : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/clients')} className="flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Kthehu</Button>
        <div>
          <h1 className="text-4xl font-display text-dark-500">{client.full_name}</h1>
          <p className="text-gray-600">Detajet e klientit dhe historia e porosive</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Informacioni i Klientit</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center"><Phone className="w-4 h-4 text-primary-500" /></div>
              <div><p className="text-xs text-gray-500">Telefoni</p><p className="text-sm font-medium">{client.phone || 'N/A'}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><Mail className="w-4 h-4 text-blue-500" /></div>
              <div><p className="text-xs text-gray-500">Email</p><p className="text-sm font-medium">{client.email || 'N/A'}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center"><MapPin className="w-4 h-4 text-green-500" /></div>
              <div><p className="text-xs text-gray-500">Adresa</p><p className="text-sm font-medium">{client.address || 'N/A'}</p></div>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Statistikat</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-primary-50 rounded-lg p-4 text-center ring-1 ring-primary-100"><p className="text-2xl font-bold text-primary-600">{totalOrders}</p><p className="text-xs text-gray-600 mt-1">Porosi Gjithsej</p></div>
            <div className="bg-green-50 rounded-lg p-4 text-center ring-1 ring-green-100"><p className="text-2xl font-bold text-green-600">{paidOrders}</p><p className="text-xs text-gray-600 mt-1">Të Paguara</p></div>
            <div className="bg-red-50 rounded-lg p-4 text-center ring-1 ring-red-100"><p className="text-2xl font-bold text-red-600">{unpaidOrders}</p><p className="text-xs text-gray-600 mt-1">Pa Paguar</p></div>
            <div className="bg-amber-50 rounded-lg p-4 text-center ring-1 ring-amber-100"><p className="text-2xl font-bold text-amber-600">{formatCurrency(totalSpent)}</p><p className="text-xs text-gray-600 mt-1">Shuma Totale</p></div>
          </div>
        </Card>
      </div>

      {clientCars.length > 0 && (
        <Card>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Automjetet e Klientit</h3>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedCarId('all')}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${selectedCarId === 'all' ? 'bg-primary-400 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              Të gjitha ({orders.length})
            </button>
            {clientCars.map(car => {
              const cnt = orders.filter(o => o.car_id === car.id).length
              return (
                <button key={car.id} onClick={() => setSelectedCarId(String(car.id))}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${String(selectedCarId) === String(car.id) ? 'bg-primary-400 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  <Car className="w-4 h-4" /> {car.make} {car.model} <span className="text-xs opacity-75">({car.license_plate})</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${String(selectedCarId) === String(car.id) ? 'bg-white/20' : 'bg-gray-200'}`}>{cnt}</span>
                </button>
              )
            })}
          </div>
          {selectedCar && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><span className="text-gray-500 text-xs">Marka / Modeli</span><p className="font-medium">{selectedCar.make} {selectedCar.model}</p></div>
                <div><span className="text-gray-500 text-xs">Viti</span><p className="font-medium">{selectedCar.year}</p></div>
                <div><span className="text-gray-500 text-xs">Targa</span><p className="font-mono font-medium">{selectedCar.license_plate}</p></div>
                <div><span className="text-gray-500 text-xs">VIN</span><p className="font-mono font-medium text-xs">{selectedCar.vin || 'N/A'}</p></div>
              </div>
            </div>
          )}
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display text-dark-500">
            Historia e Porosive
            {selectedCar && <span className="text-sm text-gray-500 font-normal ml-2">— {selectedCar.make} {selectedCar.model}</span>}
          </h3>
          <span className="text-sm text-gray-500">{filteredOrders.length} porosi</span>
        </div>
        {filteredOrders.length === 0 ? (
          <EmptyState title="Nuk ka porosi" description={selectedCarId !== 'all' ? "Ky automjet nuk ka porosi ende" : "Ky klient nuk ka porosi ende"} />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableHeaderCell>ID</TableHeaderCell>
                <TableHeaderCell>Automjeti</TableHeaderCell>
                <TableHeaderCell>Km</TableHeaderCell>
                <TableHeaderCell>Shërbimet</TableHeaderCell>
                <TableHeaderCell>Totali</TableHeaderCell>
                <TableHeaderCell>Statusi</TableHeaderCell>
                <TableHeaderCell>Data</TableHeaderCell>
                <TableHeaderCell>Printo</TableHeaderCell>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell><span className="font-mono font-semibold">#{order.id}</span></TableCell>
                    <TableCell><span className="text-sm">{order.cars?.make} {order.cars?.model}<span className="block text-xs text-gray-400">{order.cars?.license_plate}</span></span></TableCell>
                    <TableCell><span className="text-sm">{order.km ? Number(order.km).toLocaleString() + ' km' : '\u2014'}</span></TableCell>
                    <TableCell><div className="text-sm text-gray-600">{order.order_items?.map((item, idx) => <div key={idx}>• {item.service_name}</div>)}</div></TableCell>
                    <TableCell><span className="font-semibold">{formatCurrency(calculateOrderTotal(order))}</span></TableCell>
                    <TableCell><Badge variant={order.is_paid ? 'success' : 'danger'}>{order.is_paid ? 'Paguar' : 'Pa paguar'}</Badge></TableCell>
                    <TableCell><div className="flex items-center gap-1.5 text-sm text-gray-600"><Calendar className="w-3.5 h-3.5" />{formatDate(order.created_at)}</div></TableCell>
                    <TableCell>
                      <Button size="sm" variant="secondary" onClick={() => openPrintModal(order)}>
                        <Printer className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={filteredOrders.length} />
          </>
        )}
      </Card>

      {/* Print Modal with Options */}
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
              <input type="checkbox" checked={printShowOrderNo} onChange={(e) => setPrintShowOrderNo(e.target.checked)}
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
    </div>
  )
}

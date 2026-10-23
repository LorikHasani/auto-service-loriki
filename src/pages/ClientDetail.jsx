import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Car, Phone, Mail, MapPin, Printer, Calendar, Eye, Wrench, FileText, Edit2, X, Gauge } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Modal } from '../components/Modal'
import { Input } from '../components/Input'
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell, Badge } from '../components/Table'
import { Loading, EmptyState } from '../components/Loading'
import { Pagination, paginate, usePagination } from '../components/Pagination'
import { OrderDetailContent } from '../components/OrderDetail'
import { formatCurrency, calculateOrderTotal, formatDate, formatDurationShort } from '../utils/helpers'
import { printOrderDocument, printServiceHistory, printOrderReports } from '../utils/printOrder'
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
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [detailOrder, setDetailOrder] = useState(null)
  const [isHistoryPrintOpen, setIsHistoryPrintOpen] = useState(false)
  const [historyShowPrices, setHistoryShowPrices] = useState(true)
  const [historyMode, setHistoryMode] = useState('combined')
  const [historyShowOrderNo, setHistoryShowOrderNo] = useState(false)

  // Edit client / vehicle state
  const [isClientEditOpen, setIsClientEditOpen] = useState(false)
  const [clientForm, setClientForm] = useState({ full_name: '', phone: '', email: '', address: '' })
  const [isCarEditOpen, setIsCarEditOpen] = useState(false)
  const [carForm, setCarForm] = useState({ make: '', model: '', year: '', color: '', license_plate: '', vin: '' })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const vehiclePanelRef = useRef(null)

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

  const executeHistoryPrint = () => {
    const car = selectedCarId !== 'all' ? clientCars.find(c => String(c.id) === String(selectedCarId)) : null
    if (historyMode === 'separate') {
      printOrderReports(filteredOrders, { showPrices: historyShowPrices, showOrderNo: historyShowOrderNo, title: 'Raportet e Shërbimeve - ' + client.full_name })
    } else {
      printServiceHistory(filteredOrders, { client, car, showPrices: historyShowPrices })
    }
    setIsHistoryPrintOpen(false)
  }

  const handleNewService = (car) => navigate('/orders', { state: { prefillCar: car } })

  // Show the vehicle's details in the panel above instead of navigating away
  const selectCar = (carId) => {
    setSelectedCarId(String(carId))
    requestAnimationFrame(() => vehiclePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const openClientEdit = () => {
    setClientForm({ full_name: client.full_name || '', phone: client.phone || '', email: client.email || '', address: client.address || '' })
    setIsClientEditOpen(true)
  }

  const handleClientSave = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      const { data, error } = await supabase.from('clients').update(clientForm).eq('id', client.id).select().single()
      if (error) throw error
      setClient(data)
      // Keep the client info shown in order rows / prints in sync
      setOrders(prev => prev.map(o => ({ ...o, clients: { ...o.clients, full_name: data.full_name, phone: data.phone, email: data.email } })))
      setIsClientEditOpen(false)
    } catch (error) { alert('Gabim: ' + error.message) }
    finally { setSubmitting(false) }
  }

  const openCarEdit = (car) => {
    setCarForm({ make: car.make || '', model: car.model || '', year: car.year || '', color: car.color || '', license_plate: car.license_plate || '', vin: car.vin || '' })
    setFormError('')
    setIsCarEditOpen(true)
  }

  const handleCarSave = async (e) => {
    e.preventDefault(); setSubmitting(true); setFormError('')
    try {
      const car = clientCars.find(c => String(c.id) === String(selectedCarId))
      const plate = carForm.license_plate.trim().toUpperCase()
      const vin = carForm.vin?.trim().toUpperCase() || ''

      const { data: dupPlate, error: dupErr } = await supabase.from('cars').select('id, make, model').eq('license_plate', plate).neq('id', car.id).limit(1)
      if (dupErr) throw dupErr
      if (dupPlate?.length) { setFormError('Kjo targë ekziston tashmë: ' + dupPlate[0].make + ' ' + dupPlate[0].model); return }
      if (vin) {
        const { data: dupVin, error: vinErr } = await supabase.from('cars').select('id, make, model').eq('vin', vin).neq('id', car.id).limit(1)
        if (vinErr) throw vinErr
        if (dupVin?.length) { setFormError('Ky VIN ekziston tashmë: ' + dupVin[0].make + ' ' + dupVin[0].model); return }
      }

      const payload = { ...carForm, license_plate: plate, vin: vin || null }
      const { data, error } = await supabase.from('cars').update(payload).eq('id', car.id).select().single()
      if (error) throw error
      setClientCars(prev => prev.map(c => c.id === data.id ? data : c))
      setOrders(prev => prev.map(o => o.car_id === data.id ? { ...o, cars: { ...o.cars, make: data.make, model: data.model, license_plate: data.license_plate, vin: data.vin } } : o))
      setIsCarEditOpen(false)
    } catch (error) { alert('Gabim: ' + error.message) }
    finally { setSubmitting(false) }
  }

  if (loading) return <Loading />
  if (!client) return null

  const selectedCar = selectedCarId !== 'all' ? clientCars.find(c => String(c.id) === String(selectedCarId)) : null
  const kmValues = filteredOrders.filter(o => o.km).map(o => Number(o.km))
  const selectedCarLastKm = selectedCar && kmValues.length > 0 ? Math.max(...kmValues) : null
  const selectedCarLastService = selectedCar && filteredOrders.length > 0 ? filteredOrders[0].created_at : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/clients')} className="flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Kthehu</Button>
          <div>
            <h1 className="text-2xl sm:text-4xl font-display text-dark-500">{client.full_name}</h1>
            <p className="text-gray-600">Detajet e klientit dhe historia e porosive</p>
          </div>
        </div>
        {filteredOrders.length > 0 && (
          <Button variant="secondary" onClick={() => { setHistoryShowPrices(true); setIsHistoryPrintOpen(true) }} className="flex items-center gap-2">
            <FileText className="w-4 h-4" /> Printo Të Gjitha Shërbimet
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Informacioni i Klientit</h3>
            <Button size="sm" variant="outline" onClick={openClientEdit} className="flex items-center gap-1.5"><Edit2 className="w-3.5 h-3.5" /> Ndrysho</Button>
          </div>
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
          <div ref={vehiclePanelRef} className="scroll-mt-4" />
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Automjetet e Klientit</h3>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedCarId('all')}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${selectedCarId === 'all' ? 'bg-primary-400 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              Të gjitha ({orders.length})
            </button>
            {clientCars.map(car => {
              const cnt = orders.filter(o => o.car_id === car.id).length
              const active = String(selectedCarId) === String(car.id)
              return (
                <div key={car.id} className={`flex items-stretch rounded-lg overflow-hidden transition-all ${active ? 'bg-primary-400 text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}>
                  <button onClick={() => selectCar(car.id)}
                    className={`px-4 py-2.5 text-sm font-medium flex items-center gap-2 transition-colors ${active ? '' : 'hover:bg-gray-200'}`}>
                    <Car className="w-4 h-4" /> {car.make} {car.model} <span className="text-xs opacity-75">({car.license_plate})</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-gray-200'}`}>{cnt}</span>
                  </button>
                  <button onClick={() => handleNewService(car)} title="Shto servisim për këtë automjet"
                    className={`px-2.5 flex items-center border-l transition-colors ${active ? 'border-white/25 hover:bg-primary-500' : 'border-gray-200 hover:bg-gray-200'}`}>
                    <Wrench className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
          {selectedCar && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center"><Car className="w-5 h-5 text-primary-500" /></div>
                  <div>
                    <p className="text-lg font-display text-dark-500">{selectedCar.make} {selectedCar.model}</p>
                    <p className="text-sm text-gray-500 font-mono">{selectedCar.license_plate}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedCarId('all')} title="Mbyll" className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                <div><span className="text-gray-500 text-xs">Viti</span><p className="font-medium">{selectedCar.year || '—'}</p></div>
                <div><span className="text-gray-500 text-xs">Ngjyra</span><p className="font-medium">{selectedCar.color || '—'}</p></div>
                <div><span className="text-gray-500 text-xs">Targa</span><p className="font-mono font-medium">{selectedCar.license_plate}</p></div>
                <div><span className="text-gray-500 text-xs">VIN</span><p className="font-mono font-medium text-xs break-all">{selectedCar.vin || 'N/A'}</p></div>
                <div><span className="text-gray-500 text-xs">Km e fundit</span><p className="font-medium flex items-center gap-1"><Gauge className="w-3.5 h-3.5 text-gray-400" />{selectedCarLastKm ? selectedCarLastKm.toLocaleString() + ' km' : '—'}</p></div>
                <div><span className="text-gray-500 text-xs">Servisimi i fundit</span><p className="font-medium">{selectedCarLastService ? formatDate(selectedCarLastService) : '—'}</p></div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                <Button size="sm" onClick={() => handleNewService(selectedCar)} className="flex items-center gap-2"><Wrench className="w-4 h-4" /> Shto Servisim</Button>
                <Button size="sm" variant="outline" onClick={() => openCarEdit(selectedCar)} className="flex items-center gap-2"><Edit2 className="w-4 h-4" /> Ndrysho Automjetin</Button>
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
                <TableHeaderCell>Kohëzgjatja</TableHeaderCell>
                <TableHeaderCell>Statusi</TableHeaderCell>
                <TableHeaderCell>Data</TableHeaderCell>
                <TableHeaderCell>Veprime</TableHeaderCell>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell><span className="font-mono font-semibold">#{order.id}</span></TableCell>
                    <TableCell>
                      <button onClick={() => order.car_id && selectCar(order.car_id)} title="Shiko automjetin"
                        className="text-left text-sm hover:text-primary-500 hover:underline transition-colors">
                        {[order.cars?.make, order.cars?.model].filter(Boolean).join(' ') || 'N/A'}
                        {order.cars?.license_plate && <span className="block text-xs text-gray-400 font-mono">{order.cars.license_plate}</span>}
                      </button>
                    </TableCell>
                    <TableCell><span className="text-sm">{order.km ? Number(order.km).toLocaleString() + ' km' : '\u2014'}</span></TableCell>
                    <TableCell><div className="text-sm text-gray-600">{order.order_items?.map((item, idx) => <div key={idx}>• {item.service_name}</div>)}</div></TableCell>
                    <TableCell><span className="font-semibold">{formatCurrency(calculateOrderTotal(order))}</span></TableCell>
                    <TableCell><span className="text-sm text-gray-600 font-mono">{formatDurationShort(order.service_duration)}</span></TableCell>
                    <TableCell><Badge variant={order.is_paid ? 'success' : 'danger'}>{order.is_paid ? 'Paguar' : 'Pa paguar'}</Badge></TableCell>
                    <TableCell><div className="flex items-center gap-1.5 text-sm text-gray-600"><Calendar className="w-3.5 h-3.5" />{formatDate(order.created_at)}</div></TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => { setDetailOrder(order); setIsDetailModalOpen(true) }} title="Detajet">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => openPrintModal(order)} title="Printo">
                          <Printer className="w-4 h-4" />
                        </Button>
                      </div>
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

      {/* Print All Services Modal */}
      <Modal isOpen={isHistoryPrintOpen} onClose={() => setIsHistoryPrintOpen(false)} title="Printo Të Gjitha Shërbimet" size="sm">
        <div className="space-y-5">
          <div className="bg-gray-50 rounded-lg p-4 text-sm">
            <p><strong>Klienti:</strong> {client.full_name}</p>
            <p><strong>Automjeti:</strong> {selectedCar ? selectedCar.make + ' ' + selectedCar.model + ' (' + selectedCar.license_plate + ')' : 'Të gjitha'}</p>
            <p><strong>Servisime:</strong> {filteredOrders.length}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'combined', label: 'Të gjitha bashkë', desc: 'Një listë me të gjitha servisimet' },
              { value: 'separate', label: 'Raport për secilin', desc: 'Raport shërbimi i veçantë për çdo servisim' },
            ].map(opt => (
              <button key={opt.value} type="button" onClick={() => setHistoryMode(opt.value)}
                className={`p-3 rounded-lg border text-left transition-colors ${historyMode === opt.value ? 'border-primary-400 bg-primary-50 ring-2 ring-primary-100' : 'border-gray-200 hover:bg-gray-50'}`}>
                <span className="font-medium text-sm block">{opt.label}</span>
                <span className="text-xs text-gray-500">{opt.desc}</span>
              </button>
            ))}
          </div>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
            <input type="checkbox" checked={historyShowPrices} onChange={(e) => setHistoryShowPrices(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary-400 focus:ring-primary-400" />
            <div><span className="font-medium text-sm">Shfaq çmimet</span><p className="text-xs text-gray-500">{historyMode === 'separate' ? 'Çmimi, sasia dhe totali në çdo raport' : 'Totali për secilin servisim dhe shuma totale'}</p></div>
          </label>
          {historyMode === 'separate' && (
            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
              <input type="checkbox" checked={historyShowOrderNo} onChange={(e) => setHistoryShowOrderNo(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary-400 focus:ring-primary-400" />
              <div><span className="font-medium text-sm">Shfaq numrin e porosisë</span><p className="text-xs text-gray-500">Pa këtë, titulli është "Raport Shërbimi"</p></div>
            </label>
          )}
          <div className="flex gap-3 justify-end pt-3 border-t">
            <Button variant="outline" onClick={() => setIsHistoryPrintOpen(false)}>Anulo</Button>
            <Button onClick={executeHistoryPrint} className="flex items-center gap-2"><Printer className="w-4 h-4" /> Printo</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Client Modal */}
      <Modal isOpen={isClientEditOpen} onClose={() => setIsClientEditOpen(false)} title="Ndrysho Klientin">
        <form onSubmit={handleClientSave} className="space-y-4">
          <Input label="Emri i Plotë" value={clientForm.full_name} onChange={(e) => setClientForm({ ...clientForm, full_name: e.target.value })} required />
          <Input label="Telefoni" type="tel" value={clientForm.phone} onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })} required />
          <Input label="Email" type="email" value={clientForm.email} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })} />
          <Input label="Adresa" value={clientForm.address} onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })} />
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setIsClientEditOpen(false)}>Anulo</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Duke ruajtur...' : 'Përditëso'}</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Vehicle Modal */}
      <Modal isOpen={isCarEditOpen} onClose={() => setIsCarEditOpen(false)} title="Ndrysho Automjetin">
        <form onSubmit={handleCarSave} className="space-y-4">
          {formError && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{formError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Marka" value={carForm.make} onChange={(e) => setCarForm({ ...carForm, make: e.target.value })} required />
            <Input label="Modeli" value={carForm.model} onChange={(e) => setCarForm({ ...carForm, model: e.target.value })} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Viti" type="number" value={carForm.year} onChange={(e) => setCarForm({ ...carForm, year: e.target.value })} required />
            <Input label="Ngjyra" value={carForm.color} onChange={(e) => setCarForm({ ...carForm, color: e.target.value })} />
          </div>
          <Input label="Targa" value={carForm.license_plate} onChange={(e) => setCarForm({ ...carForm, license_plate: e.target.value })} required />
          <Input label="VIN" value={carForm.vin} onChange={(e) => setCarForm({ ...carForm, vin: e.target.value })} />
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setIsCarEditOpen(false)}>Anulo</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Duke ruajtur...' : 'Përditëso'}</Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={detailOrder ? 'Detajet — Servisimi #' + detailOrder.id : ''} size="lg">
        {detailOrder && <OrderDetailContent order={detailOrder} showClient={false} />}
      </Modal>
    </div>
  )
}

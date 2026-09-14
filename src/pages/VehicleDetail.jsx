import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Car, User, Phone, Printer, Calendar, Eye, Wrench, FileText } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Modal } from '../components/Modal'
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell, Badge } from '../components/Table'
import { Loading, EmptyState } from '../components/Loading'
import { Pagination, paginate, usePagination } from '../components/Pagination'
import { ClientLink } from '../components/EntityLink'
import { OrderDetailContent } from '../components/OrderDetail'
import { formatCurrency, calculateOrderTotal, formatDate, formatDurationShort } from '../utils/helpers'
import { printOrderDocument, printServiceHistory } from '../utils/printOrder'
import { supabase } from '../services/supabase'

export const VehicleDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [car, setCar] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const [printOrderData, setPrintOrderData] = useState(null)
  const [printShowPrices, setPrintShowPrices] = useState(true)
  const [printShowOrderNo, setPrintShowOrderNo] = useState(true)
  const [isHistoryPrintOpen, setIsHistoryPrintOpen] = useState(false)
  const [historyShowPrices, setHistoryShowPrices] = useState(true)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [detailOrder, setDetailOrder] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const { data: carData, error: carError } = await supabase
          .from('cars').select('*, clients(id, full_name, phone, email, address)').eq('id', id).single()
        if (carError) throw carError
        setCar(carData)

        const { data: ordersData, error: ordersError } = await supabase.from('orders')
          .select('*, clients(full_name, phone, email), cars(make, model, license_plate, vin), order_items(*)')
          .eq('car_id', id).order('created_at', { ascending: false })
        if (ordersError) throw ordersError
        setOrders(ordersData || [])
      } catch (error) {
        alert('Gabim duke ngarkuar: ' + error.message)
        navigate('/vehicles')
      } finally { setLoading(false) }
    }
    fetchData()
  }, [id, navigate])

  const { totalPages } = usePagination(orders)
  const paginatedOrders = paginate(orders, page)

  const totalSpent = useMemo(() => orders.reduce((sum, o) => sum + calculateOrderTotal(o), 0), [orders])
  const paidOrders = orders.filter(o => o.is_paid).length
  const unpaidOrders = orders.length - paidOrders
  const lastKm = useMemo(() => {
    const withKm = orders.filter(o => o.km)
    return withKm.length > 0 ? Math.max(...withKm.map(o => Number(o.km))) : null
  }, [orders])

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
    printServiceHistory(orders, { client: car?.clients, car, showPrices: historyShowPrices })
    setIsHistoryPrintOpen(false)
  }

  const handleNewService = () => navigate('/orders', { state: { prefillCar: car } })

  if (loading) return <Loading />
  if (!car) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Kthehu</Button>
          <div>
            <h1 className="text-2xl sm:text-4xl font-display text-dark-500">{car.make} {car.model}</h1>
            <p className="text-gray-600 font-mono">{car.license_plate}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleNewService} className="flex items-center gap-2"><Wrench className="w-4 h-4" /> Servisim i Ri</Button>
          {orders.length > 0 && (
            <Button variant="secondary" onClick={() => { setHistoryShowPrices(true); setIsHistoryPrintOpen(true) }} className="flex items-center gap-2">
              <FileText className="w-4 h-4" /> Printo Historinë
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Automjeti</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center"><Car className="w-4 h-4 text-primary-500" /></div>
              <div><p className="text-xs text-gray-500">Marka / Modeli</p><p className="font-medium">{car.make} {car.model}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div><span className="text-gray-500 text-xs">Viti</span><p className="font-medium">{car.year || '—'}</p></div>
              <div><span className="text-gray-500 text-xs">Ngjyra</span><p className="font-medium">{car.color || '—'}</p></div>
              <div><span className="text-gray-500 text-xs">Targa</span><p className="font-mono font-medium">{car.license_plate}</p></div>
              <div><span className="text-gray-500 text-xs">VIN</span><p className="font-mono font-medium text-xs break-all">{car.vin || 'N/A'}</p></div>
            </div>
            <div className="pt-3 border-t space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><User className="w-4 h-4 text-blue-500" /></div>
                <div><p className="text-xs text-gray-500">Pronari</p>
                  <ClientLink id={car.client_id} name={car.clients?.full_name} className="font-medium text-dark-500" /></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center"><Phone className="w-4 h-4 text-green-500" /></div>
                <div><p className="text-xs text-gray-500">Telefoni</p><p className="font-medium">{car.clients?.phone || 'N/A'}</p></div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Statistikat</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-primary-50 rounded-lg p-4 text-center ring-1 ring-primary-100"><p className="text-2xl font-bold text-primary-600">{orders.length}</p><p className="text-xs text-gray-600 mt-1">Servisime</p></div>
            <div className="bg-green-50 rounded-lg p-4 text-center ring-1 ring-green-100"><p className="text-2xl font-bold text-green-600">{paidOrders}</p><p className="text-xs text-gray-600 mt-1">Të Paguara</p></div>
            <div className="bg-red-50 rounded-lg p-4 text-center ring-1 ring-red-100"><p className="text-2xl font-bold text-red-600">{unpaidOrders}</p><p className="text-xs text-gray-600 mt-1">Pa Paguar</p></div>
            <div className="bg-amber-50 rounded-lg p-4 text-center ring-1 ring-amber-100"><p className="text-2xl font-bold text-amber-600">{formatCurrency(totalSpent)}</p><p className="text-xs text-gray-600 mt-1">Shuma Totale</p></div>
          </div>
          {lastKm !== null && (
            <p className="mt-4 text-sm text-gray-600">Kilometrazhi i fundit i regjistruar: <span className="font-semibold">{lastKm.toLocaleString()} km</span></p>
          )}
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display text-dark-500">Historia e Servisimeve</h3>
          <span className="text-sm text-gray-500">{orders.length} servisime</span>
        </div>
        {orders.length === 0 ? (
          <EmptyState title="Nuk ka servisime" description="Ky automjet nuk ka servisime ende"
            action={<Button onClick={handleNewService} className="flex items-center gap-2"><Wrench className="w-4 h-4" /> Krijo Servisim</Button>} />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableHeaderCell>ID</TableHeaderCell>
                <TableHeaderCell>Data</TableHeaderCell>
                <TableHeaderCell>Km</TableHeaderCell>
                <TableHeaderCell>Shërbimet</TableHeaderCell>
                <TableHeaderCell>Punonjësi</TableHeaderCell>
                <TableHeaderCell>Totali</TableHeaderCell>
                <TableHeaderCell>Kohëzgjatja</TableHeaderCell>
                <TableHeaderCell>Pagesa</TableHeaderCell>
                <TableHeaderCell>Veprime</TableHeaderCell>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell><span className="font-mono font-semibold">#{order.id}</span></TableCell>
                    <TableCell><div className="flex items-center gap-1.5 text-sm text-gray-600"><Calendar className="w-3.5 h-3.5" />{formatDate(order.created_at)}</div></TableCell>
                    <TableCell><span className="text-sm">{order.km ? Number(order.km).toLocaleString() + ' km' : '—'}</span></TableCell>
                    <TableCell><div className="text-sm text-gray-600">{order.order_items?.map((item, idx) => <div key={idx}>• {item.service_name}</div>)}</div></TableCell>
                    <TableCell><span className="text-sm text-gray-600">{order.employee_name || '—'}</span></TableCell>
                    <TableCell><span className="font-semibold">{formatCurrency(calculateOrderTotal(order))}</span></TableCell>
                    <TableCell><span className="text-sm text-gray-600 font-mono">{formatDurationShort(order.service_duration)}</span></TableCell>
                    <TableCell><Badge variant={order.is_paid ? 'success' : 'danger'}>{order.is_paid ? 'Paguar' : 'Pa paguar'}</Badge></TableCell>
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
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={orders.length} />
          </>
        )}
      </Card>

      {/* Print single order */}
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

      {/* Print full history */}
      <Modal isOpen={isHistoryPrintOpen} onClose={() => setIsHistoryPrintOpen(false)} title="Printo Historinë e Shërbimeve" size="sm">
        <div className="space-y-5">
          <div className="bg-gray-50 rounded-lg p-4 text-sm">
            <p><strong>Automjeti:</strong> {car.make} {car.model} ({car.license_plate})</p>
            <p><strong>Klienti:</strong> {car.clients?.full_name}</p>
            <p><strong>Servisime:</strong> {orders.length}</p>
          </div>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
            <input type="checkbox" checked={historyShowPrices} onChange={(e) => setHistoryShowPrices(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary-400 focus:ring-primary-400" />
            <div><span className="font-medium text-sm">Shfaq çmimet</span><p className="text-xs text-gray-500">Totali për secilin servisim dhe shuma totale</p></div>
          </label>
          <div className="flex gap-3 justify-end pt-3 border-t">
            <Button variant="outline" onClick={() => setIsHistoryPrintOpen(false)}>Anulo</Button>
            <Button onClick={executeHistoryPrint} className="flex items-center gap-2"><Printer className="w-4 h-4" /> Printo</Button>
          </div>
        </div>
      </Modal>

      {/* Order detail */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={detailOrder ? 'Detajet — Servisimi #' + detailOrder.id : ''} size="lg">
        {detailOrder && <OrderDetailContent order={detailOrder} />}
      </Modal>
    </div>
  )
}

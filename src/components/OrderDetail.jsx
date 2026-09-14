import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Badge } from './Table'
import { ClientLink, VehicleLink } from './EntityLink'
import { formatCurrency, formatDate, formatDurationShort } from '../utils/helpers'

// Shared content for the "Detajet e Servisimit" modal.
export const OrderDetailContent = ({ order, showClient = true }) => {
  const [showPrices, setShowPrices] = useState(false)
  const items = order.order_items || []
  const total = items.reduce((s, i) => s + (i.quantity * i.unit_price), 0)
  const totalCost = items.reduce((s, i) => s + (parseFloat(i.parts_cost) || 0), 0)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-4">
          {showClient && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Klienti</p>
              <ClientLink id={order.client_id} name={order.clients?.full_name} className="font-bold text-dark-500" />
              <p className="text-sm text-gray-600">{order.clients?.phone}</p>
            </div>
          )}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Automjeti</p>
            <VehicleLink id={order.car_id} car={order.cars} showPlate={false} className="font-bold text-dark-500" />
            <p className="text-sm text-gray-600">Targa: {order.cars?.license_plate}</p>
            {order.cars?.vin && <p className="text-sm text-gray-600">VIN: {order.cars?.vin}</p>}
            {order.km && <p className="text-sm text-gray-600">Km: {Number(order.km).toLocaleString()}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 content-start">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 uppercase">Data</p>
            <p className="font-semibold text-sm">{formatDate(order.created_at)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 uppercase">Punonjësi</p>
            <p className="font-semibold text-sm">{order.employee_name || '—'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 uppercase">Kohëzgjatja</p>
            <p className="font-semibold text-sm">{formatDurationShort(order.service_duration)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 uppercase">Pagesa</p>
            <Badge variant={order.is_paid ? 'success' : 'danger'}>{order.is_paid ? 'Paguar' : 'Pa paguar'}</Badge>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Shërbimet &amp; Pjesët</p>
        <div className="space-y-3">
          {items.map((item, idx) => {
            const parts = item.parts_json || []
            const laborCost = parseFloat(item.labor_cost) || 0
            return (
              <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-start">
                  <p className="font-bold text-dark-500">{item.service_name}</p>
                  {showPrices && <p className="font-bold text-primary-500">{formatCurrency(item.unit_price)}</p>}
                </div>
                {showPrices && laborCost > 0 && <p className="text-sm text-gray-600 mt-1">Puna: {formatCurrency(laborCost)}</p>}
                {parts.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {parts.filter(p => p.name).map((p, pi) => (
                      <div key={pi} className="flex justify-between text-sm text-gray-600 pl-3 border-l-2 border-gray-300">
                        <span>{p.name} {p.quantity > 1 ? '×' + p.quantity : ''}</span>
                        {showPrices && <span>{(parseFloat(p.buy_price) || 0) > 0 && <span className="text-red-500 text-xs mr-1">(-€{((parseFloat(p.buy_price) || 0) * (p.quantity || 1)).toFixed(2)})</span>}{formatCurrency((p.sell_price || 0) * (p.quantity || 1))}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-primary-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex justify-between flex-1 text-xl font-bold"><span>TOTALI:</span><span className="text-primary-600">{formatCurrency(total)}</span></div>
          <button onClick={() => setShowPrices(!showPrices)}
            className={`ml-3 p-2 rounded-lg transition-colors ${showPrices ? 'bg-primary-200 text-primary-600' : 'bg-gray-200 text-gray-400'}`}>
            {showPrices ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>
        {showPrices && (
          <>
            <div className="flex justify-between text-sm border-t pt-2"><span className="text-gray-600">Kosto Pjesëve:</span><span className="font-semibold text-red-600">-{formatCurrency(totalCost)}</span></div>
            <div className="flex justify-between text-xl font-bold"><span>FITIMI:</span><span className={total - totalCost >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(total - totalCost)}</span></div>
          </>
        )}
      </div>
    </div>
  )
}

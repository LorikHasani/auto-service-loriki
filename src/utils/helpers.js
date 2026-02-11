import { format } from 'date-fns'

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('sq-AL', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount || 0)
}

export const formatDate = (date) => {
  if (!date) return 'N/A'
  return format(new Date(date), 'dd MMM, yyyy')
}

export const formatDateTime = (date) => {
  if (!date) return 'N/A'
  return format(new Date(date), 'dd MMM, yyyy HH:mm')
}

export const calculateOrderTotal = (order) => {
  if (!order.order_items || order.order_items.length === 0) return 0
  return order.order_items.reduce((sum, item) => {
    return sum + (item.quantity * item.unit_price)
  }, 0)
}

export const calculateOrderProfit = (order) => {
  if (!order.order_items || order.order_items.length === 0) return 0
  const total = calculateOrderTotal(order)
  const cogs = order.order_items.reduce((sum, item) => sum + (item.parts_cost || 0), 0)
  return total - cogs
}

export const calculateOrderCOGS = (order) => {
  if (!order.order_items || order.order_items.length === 0) return 0
  return order.order_items.reduce((sum, item) => sum + (item.parts_cost || 0), 0)
}

export const classNames = (...classes) => {
  return classes.filter(Boolean).join(' ')
}

import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

export const useClients = () => {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchClients = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('full_name')
      if (error) throw error
      setClients(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchClients() }, [])
  return { clients, loading, error, refetch: fetchClients }
}

export const useCars = () => {
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCars = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('cars')
        .select('*, clients(full_name, phone)')
        .order('created_at', { ascending: false })
      if (error) throw error
      setCars(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCars() }, [])
  return { cars, loading, error, refetch: fetchCars }
}

export const useOrders = (includeArchived = false) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('orders')
        .select(`
          *,
          clients(full_name, phone, email),
          cars(make, model, license_plate, vin),
          order_items(*)
        `)
        .order('created_at', { ascending: false })

      if (!includeArchived) {
        query = query.eq('is_archived', false)
      }

      const { data, error } = await query
      if (error) throw error
      setOrders(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders() }, [includeArchived])
  return { orders, loading, error, refetch: fetchOrders }
}

export const useLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .order('log_date', { ascending: false })
      if (error) throw error
      setLogs(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs() }, [])
  return { logs, loading, error, refetch: fetchLogs }
}

export const useServices = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchServices = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name')
      if (error) throw error
      setServices(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchServices() }, [])
  return { services, loading, error, refetch: fetchServices }
}

export const useEmployees = () => {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name')
      if (error) throw error
      setEmployees(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEmployees() }, [])
  return { employees, loading, error, refetch: fetchEmployees }
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    netProfit: 0,
    totalCOGS: 0,
    pendingOrders: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(quantity, unit_price, parts_cost)')
        .eq('is_archived', false)
      if (ordersError) throw ordersError

      const calculations = (orders || []).reduce(
        (acc, order) => {
          const items = order.order_items || []
          const revenue = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
          const cogs = items.reduce((sum, item) => sum + (item.parts_cost || 0), 0)
          acc.totalRevenue += revenue
          acc.totalCOGS += cogs
          if (!order.is_paid) acc.pendingOrders++
          return acc
        },
        { totalRevenue: 0, totalCOGS: 0, pendingOrders: 0 }
      )
      calculations.netProfit = calculations.totalRevenue - calculations.totalCOGS
      setStats(calculations)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStats() }, [])
  return { stats, loading, error, refetch: fetchStats }
}

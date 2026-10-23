import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabase'

// Supabase caps rows per request (1000 by default, possibly lower per project),
// so page through with range() until an empty page comes back. Advancing by the
// rows actually received keeps this correct whatever the server's cap is.
// buildQuery must return a fresh, ordered query.
const PAGE_SIZE = 1000
export const fetchAll = async (buildQuery) => {
  const rows = []
  for (;;) {
    const { data, error } = await buildQuery().range(rows.length, rows.length + PAGE_SIZE - 1)
    if (error) throw error
    if (!data || data.length === 0) return rows
    rows.push(...data)
  }
}

export const useClients = () => {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchAll(() => supabase.from('clients').select('*').order('full_name').order('id'))
      setClients(data)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchClients() }, [fetchClients])
  return { clients, loading, error, refetch: fetchClients }
}

export const useCars = () => {
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCars = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchAll(() => supabase.from('cars').select('*, clients(full_name, phone)').order('created_at', { ascending: false }).order('id', { ascending: false }))
      setCars(data)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchCars() }, [fetchCars])
  return { cars, loading, error, refetch: fetchCars }
}

export const useOrders = (includeArchived = false) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      // Always fetch ALL orders - filter client-side for reliability (NULL is_archived safe)
      const data = await fetchAll(() => supabase
        .from('orders')
        .select(`*, clients(full_name, phone, email), cars(make, model, license_plate, vin), order_items(*)`)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false }))

      let result = data
      if (!includeArchived) {
        // Client-side filter: exclude only where is_archived === true
        // This correctly keeps NULL and false records
        result = result.filter(o => o.is_archived !== true)
      }
      setOrders(result)
    } catch (err) {
      setError(err.message)
      console.error('useOrders error:', err)
    } finally {
      setLoading(false)
    }
  }, [includeArchived])

  useEffect(() => { fetchOrders() }, [fetchOrders])
  return { orders, loading, error, refetch: fetchOrders }
}

export const useLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchAll(() => supabase.from('daily_logs').select('*').order('log_date', { ascending: false }).order('id', { ascending: false }))
      setLogs(data)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])
  return { logs, loading, error, refetch: fetchLogs }
}

export const useServices = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('services').select('*').order('name')
      if (error) throw error
      setServices(data || [])
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchServices() }, [fetchServices])
  return { services, loading, error, refetch: fetchServices }
}

export const useEmployees = () => {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('employees').select('*').order('name')
      if (error) throw error
      setEmployees(data || [])
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])
  return { employees, loading, error, refetch: fetchEmployees }
}

export const useExpenses = () => {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchAll(() => supabase.from('daily_expenses').select('*').order('expense_date', { ascending: false }).order('created_at', { ascending: false }).order('id', { ascending: false }))
      setExpenses(data)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])
  return { expenses, loading, error, refetch: fetchExpenses }
}

export const useSalaries = () => {
  const [salaries, setSalaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSalaries = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchAll(() => supabase.from('salary_payments').select('*, employees(name)').order('payment_date', { ascending: false }).order('created_at', { ascending: false }).order('id', { ascending: false }))
      setSalaries(data)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchSalaries() }, [fetchSalaries])
  return { salaries, loading, error, refetch: fetchSalaries }
}

export const useAppointments = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchAll(() => supabase
        .from('appointments')
        .select('*, clients(full_name, phone), cars(make, model, license_plate)')
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true, nullsFirst: true })
        .order('id', { ascending: true }))
      setAppointments(data)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])
  return { appointments, loading, error, refetch: fetchAppointments }
}

// Auto-archive old orders (runs from App.jsx on load).
// Archives every non-archived order (false or NULL) created before local midnight
// in a single filtered UPDATE, so no row limit applies. Throws on failure.
export const autoArchiveOldOrders = async () => {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('orders')
    .update({ is_archived: true, archived_at: new Date().toISOString() })
    .or('is_archived.is.null,is_archived.eq.false')
    .lt('created_at', startOfToday.toISOString())
    .select('id')
  if (error) throw error

  const count = data?.length || 0
  if (count > 0) console.log('Auto-archived', count, 'orders')
  return count
}
